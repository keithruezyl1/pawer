/**
 * Feed source: one conditional GET against the published advisories file.
 *
 * The pipeline writes `advisories.json` to GitHub Pages, which serves a real ETag, so a poll that
 * finds nothing new costs a 304 and no body — 11 KB gzipped when it IS new (FR-17). Failure never
 * loses data: the caller keeps its last-known-good and only the freshness caption changes (FR-18).
 */
import { validateAdvisories, type Outage } from "@pawer/shared";
import { loadFixture } from "./fixtures/advisories.fixture";

export const FEED_BASE_URL = "https://keithruezyl1.github.io/pawer/v1";

/**
 * Where a user goes to get a newer APK. There is no store to send them to (D-2), and until the
 * app reads `version.json` this is the releases page rather than a direct download.
 */
export const RELEASES_URL = "https://github.com/keithruezyl1/pawer/releases";

/** The advisories schema this build understands. A higher one in the feed means update the app. */
export const SUPPORTED_SCHEMA_VERSION = 1;

/** A phone on a bad connection must not hang the dashboard behind a socket that never answers. */
const TIMEOUT_MS = 12_000;

export interface FeedResult {
  /** "fresh" = new body, "unchanged" = 304, "error" = keep last-known-good. */
  kind: "fresh" | "unchanged" | "error";
  outages?: Outage[];
  etag?: string | null;
  /**
   * Only on "error", and it decides which screen the user sees:
   *   offline   we never reached the server — their problem, and their saved data still stands
   *   server    it answered, badly — our problem, and saying so is the honest thing
   *   outdated  the feed is a schema this build cannot read — the app is what needs fixing
   */
  reason?: "offline" | "server" | "outdated";
  /** Short and concrete, so a screenshot of the error screen is enough to act on. */
  code?: string;
}

export interface FeedSource {
  fetch(previousEtag: string | null, nowMs: number): Promise<FeedResult>;
}

export const httpSource: FeedSource = {
  async fetch(previousEtag) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${FEED_BASE_URL}/advisories.json`, {
        signal: controller.signal,
        // An ETag we were given back verbatim. Absent on a first run, and after a cache wipe.
        headers: previousEtag ? { "If-None-Match": previousEtag } : {},
      });
    } catch (e) {
      // DNS, no route, TLS, or our own timeout — all indistinguishable from here, and all mean
      // the same thing to the user: the phone could not reach us.
      const aborted = (e as Error)?.name === "AbortError";
      return { kind: "error", reason: "offline", code: aborted ? "timeout" : undefined };
    } finally {
      clearTimeout(timer);
    }

    // 304 is a success: it means what we already hold is still current (FR-17).
    if (res.status === 304) return { kind: "unchanged", etag: previousEtag };
    if (!res.ok) return { kind: "error", reason: "server", code: String(res.status) };

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return { kind: "error", reason: "server", code: "bad-json" };
    }

    // "malformed" is our problem and "outdated" is the app's; the dashboard shows a different
    // screen for each, so the distinction survives the trip up.
    const v = validateAdvisories(body, SUPPORTED_SCHEMA_VERSION);
    if (!v.ok) return { kind: "error", reason: v.reason === "outdated" ? "outdated" : "server", code: v.code };
    return { kind: "fresh", outages: v.file.outages, etag: res.headers.get("etag") };
  },
};

/** Kept for tests and for running the app with no network at all. */
export const fixtureSource: FeedSource = {
  async fetch(_prev, nowMs) {
    await new Promise((r) => setTimeout(r, 350)); // enough to see `tick` on the caption
    return { kind: "fresh", outages: loadFixture(nowMs), etag: "fixture" };
  },
};

export const feedSource: FeedSource = httpSource;
