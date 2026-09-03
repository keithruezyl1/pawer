/**
 * The ingest orchestration (ARCH §4.1), with every side effect injected so it runs identically
 * against fakes in tests and against fetch/fs/FCM/GitHub in CI.
 *
 *   feed → select → hash → diff → parse changed → merge → write data/ → notify → issues → heartbeat
 */
import { toIsoManila, type AdvisoriesFile, type Outage } from "@pawer/shared";
import { parseAdvisory } from "@pawer/parser";
import { parseFeed, selectAdvisories, type FeedItem } from "./rss";
import { contentHash, diffSeen } from "./diff";
import { mergeOutages, selectToNotify, topicsFor } from "./merge";
import { buildAdvisoriesFile } from "./publish";
import { updateCoverage, type Coverage } from "./coverage";
import { filterAlreadyOpen, formatUnknownAreaIssue, type IssueDraft } from "./issues";
import { needsHeartbeat } from "./heartbeat";

export const FEED_URL = "https://www.visayanelectric.com/blog-feed.xml";

export const PATHS = {
  advisories: "data/advisories.json",
  seen: "data/seen.json",
  notified: "data/notified.json",
  coverage: "data/coverage.json",
  heartbeat: "data/heartbeat.json",
} as const;

export interface IngestDeps {
  now: () => number;
  fetchText: (url: string) => Promise<string>;
  readJson: <T>(path: string) => T | null;
  writeJson: (path: string, value: unknown) => void;
  /** Push one data-only message to a topic. Resolves true on success. */
  push: (topic: string, outageIds: string[]) => Promise<boolean>;
  openIssue: (issue: IssueDraft) => Promise<void>;
  listOpenIssueTitles: () => Promise<string[]>;
  log: (message: string) => void;
}

export interface IngestResult {
  changed: boolean;
  failedFetches: string[];
  parsed: number;
  pushed: number;
  issuesOpened: number;
}

export async function runIngest(deps: IngestDeps): Promise<IngestResult> {
  const nowMs = deps.now();

  let xml: string;
  try {
    xml = await deps.fetchText(FEED_URL);
  } catch (e) {
    throw new Error(`feed fetch failed: ${(e as Error).message}`);
  }
  const items = selectAdvisories(parseFeed(xml));
  deps.log(`feed: ${items.length} advisory item(s)`);

  // fetch + hash every advisory; a failed fetch is reported and retried next run
  const html: Record<string, string> = {};
  const hashes: Record<string, string> = {};
  const failedFetches: string[] = [];
  for (const it of items) {
    try {
      const body = await deps.fetchText(it.link);
      html[it.link] = body;
      hashes[it.link] = contentHash(body);
    } catch (e) {
      failedFetches.push(it.link);
      deps.log(`fetch failed: ${it.link} — ${(e as Error).message}`);
    }
  }

  const seen = deps.readJson<Record<string, string>>(PATHS.seen) ?? {};
  const diff = diffSeen(items, seen, hashes);
  const toParse: FeedItem[] = [...diff.added, ...diff.changed];
  deps.log(`diff: ${diff.added.length} new, ${diff.changed.length} changed, ${diff.unchanged.length} unchanged, ${diff.failed.length} failed`);

  let pushed = 0;
  let issuesOpened = 0;
  let parsed = 0;
  const changed = toParse.length > 0;

  if (changed) {
    const existing = deps.readJson<AdvisoriesFile>(PATHS.advisories)?.outages ?? [];
    const incoming: Outage[] = toParse.flatMap((it) =>
      parseAdvisory(html[it.link]!, { postUrl: it.link, publishedAt: it.publishedAt }),
    );
    parsed = incoming.length;
    const merged = mergeOutages(existing, incoming, nowMs);
    deps.writeJson(PATHS.advisories, buildAdvisoriesFile(merged, new Date(nowMs).toISOString()));

    const nextSeen = { ...seen };
    for (const it of [...toParse, ...diff.unchanged]) nextSeen[it.link] = hashes[it.link]!;
    deps.writeJson(PATHS.seen, nextSeen);

    // notify: only outages from re-parsed posts, future, not yet notified; group by topic
    const notified = deps.readJson<string[]>(PATHS.notified) ?? [];
    const toNotify = selectToNotify(incoming, notified, nowMs);
    const byTopic = new Map<string, string[]>();
    for (const o of toNotify) for (const t of topicsFor(o)) byTopic.set(t, [...(byTopic.get(t) ?? []), o.id]);
    const okTopics = new Set<string>();
    for (const [topic, ids] of byTopic) {
      if (await deps.push(topic, ids)) { okTopics.add(topic); pushed++; }
      else deps.log(`push failed: ${topic}`);
    }
    // an outage is "notified" only once every one of its topics went out; otherwise it retries next run
    const nowNotified = toNotify.filter((o) => topicsFor(o).every((t) => okTopics.has(t))).map((o) => o.id);
    if (nowNotified.length) deps.writeJson(PATHS.notified, [...notified, ...nowNotified]);

    // coverage (R9)
    const coverage = deps.readJson<Coverage>(PATHS.coverage) ?? {};
    deps.writeJson(PATHS.coverage, updateCoverage(coverage, merged));

    // unknown-area issues (NFR-22), de-duplicated within the run and against what is already open
    const drafts = new Map<string, IssueDraft>();
    for (const o of incoming) for (const t of o.unknown_area_tokens) {
      const d = formatUnknownAreaIssue(t, o);
      if (!drafts.has(d.title.toLowerCase())) drafts.set(d.title.toLowerCase(), d);
    }
    if (drafts.size) {
      const open = await deps.listOpenIssueTitles();
      for (const d of filterAlreadyOpen([...drafts.values()], open)) {
        await deps.openIssue(d);
        issuesOpened++;
      }
    }
    deps.log(`parsed ${parsed} outage(s) from ${toParse.length} post(s); pushed ${pushed} topic(s); opened ${issuesOpened} issue(s)`);
  } else {
    deps.log("nothing changed");
  }

  const hb = deps.readJson<{ last_run: string }>(PATHS.heartbeat);
  if (changed || needsHeartbeat(hb?.last_run ?? null, nowMs)) {
    deps.writeJson(PATHS.heartbeat, { last_run: toIsoManila(nowMs) });
  }

  return { changed, failedFetches, parsed, pushed, issuesOpened };
}
