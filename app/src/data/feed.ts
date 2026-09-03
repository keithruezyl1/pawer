/**
 * Feed source. In this phase the "network" is the fixture; the interface is shaped for the real
 * thing (conditional GET with ETag → 304 counts as success, FR-17) so swapping it in later
 * touches nothing above this file.
 */
import type { Outage } from "@pawer/shared";
import { loadFixture } from "./fixtures/advisories.fixture";

export const FEED_BASE_URL = "https://keithruezyl1.github.io/pawer/v1";

export interface FeedResult {
  /** "fresh" = new body, "unchanged" = 304, "error" = keep last-known-good. */
  kind: "fresh" | "unchanged" | "error";
  outages?: Outage[];
  etag?: string | null;
  error?: string;
}

export interface FeedSource {
  fetch(previousEtag: string | null, nowMs: number): Promise<FeedResult>;
}

export const fixtureSource: FeedSource = {
  async fetch(_prev, nowMs) {
    await new Promise((r) => setTimeout(r, 350)); // enough to see `tick` on the caption
    return { kind: "fresh", outages: loadFixture(nowMs), etag: "fixture" };
  },
};

export const feedSource: FeedSource = fixtureSource;
