import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { parseFeed, selectAdvisories } from "../src/rss";

const xml = readFileSync(new URL("./fixtures/blog-feed.xml", import.meta.url), "utf8");

describe("parseFeed — VECO's Wix RSS 2.0", () => {
  const items = parseFeed(xml);

  test("reads every item with title, link, and an ISO publishedAt", () => {
    expect(items.length).toBeGreaterThan(3);
    for (const it of items) {
      expect(it.title).toBeTruthy();
      expect(it.link).toMatch(/^https:\/\/www\.visayanelectric\.com\/post\//);
      expect(it.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
    }
  });

  test("unwraps CDATA in titles", () => {
    expect(items.some((i) => i.title === "Service Interruption: August 30-September 5, 2026")).toBe(true);
    expect(items.some((i) => i.title.includes("CDATA"))).toBe(false);
  });

  test("converts RFC 822 pubDate to ISO", () => {
    const it = items.find((i) => i.title.startsWith("Service Interruption: August 30"))!;
    expect(it.publishedAt).toBe("2026-08-27T08:33:35.000Z");
  });
});

describe("selectAdvisories — the title filter that drops bidding notices and HR posts", () => {
  test("keeps only 'Service Interruption:' titles, case-insensitively", () => {
    const sel = selectAdvisories(parseFeed(xml));
    expect(sel).toHaveLength(3);
    for (const it of sel) expect(it.title).toMatch(/^Service Interruption:/i);
  });

  test("ignores look-alikes that merely mention interruptions", () => {
    const sel = selectAdvisories([
      { title: "Notice on Service Interruption Policy", link: "https://x/post/a", publishedAt: "2026-01-01T00:00:00.000Z" },
      { title: "service interruption: test week", link: "https://x/post/b", publishedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(sel.map((s) => s.link)).toEqual(["https://x/post/b"]);
  });
});
