import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { contentHash, diffSeen } from "../src/diff";

const html = readFileSync(new URL("../../packages/parser/corpus/2026-08-30.html", import.meta.url), "utf8");

describe("contentHash — hashes the advisory TEXT, not the Wix markup", () => {
  test("is stable for identical input", () => {
    expect(contentHash(html)).toBe(contentHash(html));
    expect(contentHash(html)).toMatch(/^[0-9a-f]{64}$/);
  });

  test("ignores markup churn that does not change the text (class names, CSS)", () => {
    const churned = html.replace(/class="[^"]*"/g, 'class="x"').replace(/style="[^"]*"/g, "");
    expect(contentHash(churned)).toBe(contentHash(html));
  });

  test("changes when the advisory text changes", () => {
    expect(contentHash(html.replace("8:00 AM to 4:00 PM (8hrs)", "9:00 AM to 4:00 PM (7hrs)"))).not.toBe(contentHash(html));
  });
});

describe("diffSeen — what to fetch and re-parse", () => {
  const items = [
    { title: "Service Interruption: A", link: "https://x/post/a", publishedAt: "2026-08-27T00:00:00.000Z" },
    { title: "Service Interruption: B", link: "https://x/post/b", publishedAt: "2026-08-20T00:00:00.000Z" },
    { title: "Service Interruption: C", link: "https://x/post/c", publishedAt: "2026-08-13T00:00:00.000Z" },
  ];

  test("everything is new on first run", () => {
    const d = diffSeen(items, {}, { "https://x/post/a": "h1", "https://x/post/b": "h2", "https://x/post/c": "h3" });
    expect(d.added.map((i) => i.link)).toEqual(["https://x/post/a", "https://x/post/b", "https://x/post/c"]);
    expect(d.changed).toEqual([]);
    expect(d.unchanged).toEqual([]);
  });

  test("an unchanged hash is unchanged; a different hash is changed; an unseen url is added", () => {
    const seen = { "https://x/post/a": "h1", "https://x/post/b": "old" };
    const d = diffSeen(items, seen, { "https://x/post/a": "h1", "https://x/post/b": "h2", "https://x/post/c": "h3" });
    expect(d.unchanged.map((i) => i.link)).toEqual(["https://x/post/a"]);
    expect(d.changed.map((i) => i.link)).toEqual(["https://x/post/b"]);
    expect(d.added.map((i) => i.link)).toEqual(["https://x/post/c"]);
  });

  test("an item whose fetch failed (no hash) is reported separately and never marked seen", () => {
    const d = diffSeen(items, {}, { "https://x/post/a": "h1" });
    expect(d.added.map((i) => i.link)).toEqual(["https://x/post/a"]);
    expect(d.failed.map((i) => i.link)).toEqual(["https://x/post/b", "https://x/post/c"]);
  });
});
