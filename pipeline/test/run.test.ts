import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fromManila } from "@pawer/shared";
import { runIngest, type IngestDeps } from "../src/run";

/**
 * End-to-end with fakes: the real RSS fixture, the real corpus HTML, no network, no filesystem.
 * Proves the orchestration — diff → parse → merge → publish → notify → issues → heartbeat.
 */
const feedXml = readFileSync(new URL("./fixtures/blog-feed.xml", import.meta.url), "utf8");
const corpus = (name: string) => readFileSync(new URL(`../../packages/parser/corpus/${name}.html`, import.meta.url), "utf8");

const URL_A = "https://www.visayanelectric.com/post/service-interruption-august-30-september-5-2026";
const URL_B = "https://www.visayanelectric.com/post/service-interruption-august-23-29-2026";
const URL_C = "https://www.visayanelectric.com/post/service-interruption-august-16-22-2026";

function makeDeps(overrides: Partial<IngestDeps> = {}) {
  const files = new Map<string, unknown>();
  const pushed: Array<{ topic: string; ids: string[] }> = [];
  const issues: string[] = [];
  const deps: IngestDeps = {
    now: () => fromManila(2026, 8, 28, 12), // the day after the Aug 30 advisory was published
    fetchText: async (url) => {
      if (url.endsWith("blog-feed.xml")) return feedXml;
      if (url === URL_A) return corpus("2026-08-30");
      if (url === URL_B) return corpus("2026-08-23");
      throw new Error(`fetch failed: ${url}`);
    },
    readJson: <T>(path: string) => (files.get(path) as T | undefined) ?? null,
    writeJson: (path, value) => { files.set(path, value); },
    push: async (topic, ids) => { pushed.push({ topic, ids }); return true; },
    openIssue: async (issue) => { issues.push(issue.title); },
    listOpenIssueTitles: async () => [],
    log: () => {},
    ...overrides,
  };
  return { deps, files, pushed, issues };
}

describe("runIngest", () => {
  test("first run: parses every fetchable advisory, publishes, records seen hashes, notifies future outages", async () => {
    const { deps, files, pushed } = makeDeps();
    const r = await runIngest(deps);

    const adv = files.get("data/advisories.json") as { outages: unknown[] };
    expect(adv.outages).toHaveLength(31 + 23);

    const seen = files.get("data/seen.json") as Record<string, string>;
    expect(Object.keys(seen).sort()).toEqual([URL_B, URL_A].sort()); // URL_C failed to fetch → not seen
    expect(r.failedFetches).toEqual([URL_C]);

    // Only outages starting after "now" (Aug 28 noon) are pushed; the Aug 23–27 ones are past.
    const notified = files.get("data/notified.json") as string[];
    expect(notified.length).toBeGreaterThan(0);
    expect(notified.length).toBeLessThan(54);
    expect(pushed.length).toBeGreaterThan(0);
    expect(pushed.every((p) => p.topic.startsWith("veco.v1."))).toBe(true);

    expect(r.changed).toBe(true);
  });

  test("second run with nothing changed: no re-parse, no pushes, no write of advisories", async () => {
    const first = makeDeps();
    await runIngest(first.deps);
    const second = makeDeps({ readJson: first.deps.readJson });
    // reuse first run's files as the committed state
    const r = await runIngest({ ...second.deps, readJson: <T>(p: string) => (first.files.get(p) as T | undefined) ?? null, writeJson: second.deps.writeJson });
    expect(r.changed).toBe(false);
    expect(second.pushed).toEqual([]);
    expect(second.files.has("data/advisories.json")).toBe(false);
  });

  test("re-parsing an unchanged post never re-notifies (ids are stable, notified.json is honoured)", async () => {
    const first = makeDeps();
    await runIngest(first.deps);
    // force a re-parse by clearing seen but keeping notified
    const state = new Map(first.files);
    state.delete("data/seen.json");
    const second = makeDeps({ readJson: <T>(p: string) => (state.get(p) as T | undefined) ?? null });
    await runIngest(second.deps);
    expect(second.pushed).toEqual([]);
  });

  test("unknown area tokens open issues, de-duplicated against already-open titles", async () => {
    const { deps, issues } = makeDeps({ listOpenIssueTitles: async () => ['unknown area: "corona del mar subd"'] });
    await runIngest(deps);
    expect(issues).toContain('Unknown area: "Royale Cebu Estates"');
    expect(issues).not.toContain('Unknown area: "Corona Del Mar Subd"');
  });

  test("a feed fetch failure is a hard failure — the workflow must go red, not silently succeed", async () => {
    const { deps } = makeDeps({ fetchText: async () => { throw new Error("ECONNRESET"); } });
    await expect(runIngest(deps)).rejects.toThrow(/feed/i);
  });

  test("heartbeat is written when nothing changed today", async () => {
    const first = makeDeps();
    await runIngest(first.deps);
    const later = makeDeps({ readJson: <T>(p: string) => (first.files.get(p) as T | undefined) ?? null, now: () => fromManila(2026, 8, 29, 12) });
    const r = await runIngest(later.deps);
    expect(r.changed).toBe(false);
    expect(later.files.get("data/heartbeat.json")).toEqual({ last_run: expect.stringMatching(/^2026-08-29T/) });
  });
});
