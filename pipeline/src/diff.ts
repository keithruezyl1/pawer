import { createHash } from "node:crypto";
import { extractLines } from "@pawer/parser";
import type { FeedItem } from "./rss";

/** Hash of the advisory TEXT, not the markup — Wix churns class names and CSS constantly. */
export function contentHash(html: string): string {
  return createHash("sha256").update(extractLines(html).join("\n")).digest("hex");
}

export interface SeenDiff {
  added: FeedItem[];
  changed: FeedItem[];
  unchanged: FeedItem[];
  /** Items with no hash (fetch failed). Never written to seen.json, so they retry next run. */
  failed: FeedItem[];
}

export function diffSeen(items: readonly FeedItem[], seen: Record<string, string>, hashes: Record<string, string>): SeenDiff {
  const d: SeenDiff = { added: [], changed: [], unchanged: [], failed: [] };
  for (const it of items) {
    const h = hashes[it.link];
    if (!h) { d.failed.push(it); continue; }
    const prev = seen[it.link];
    if (!prev) d.added.push(it);
    else if (prev !== h) d.changed.push(it);
    else d.unchanged.push(it);
  }
  return d;
}
