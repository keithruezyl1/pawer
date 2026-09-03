import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { parseAdvisory } from "../src/index";

/**
 * Regression locks, not TDD proofs: each corpus/<name>.parsed.json was produced by
 * scripts/dump-corpus.ts and reviewed by hand against the real advisory text before being
 * committed. If the parser's output for a real page changes, this fails and a human decides
 * whether the parser regressed or the golden needs re-review (ARCH §14).
 */
const corpusDir = new URL("../corpus/", import.meta.url);
const names = readdirSync(corpusDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""));

describe("golden corpus", () => {
  test.each(names)("%s parses identically to its reviewed golden", (name) => {
    const html = readFileSync(new URL(`${name}.html`, corpusDir), "utf8");
    const golden = JSON.parse(readFileSync(new URL(`${name}.parsed.json`, corpusDir), "utf8"));
    const meta = { postUrl: `https://www.visayanelectric.com/post/corpus-${name}`, publishedAt: "2026-01-01T00:00:00Z" };
    expect(parseAdvisory(html, meta)).toEqual(golden);
  });

  test("no corpus entry is ever 'failed' — every real entry so far has a readable time", () => {
    for (const name of names) {
      const golden: Array<{ parse_status: string }> = JSON.parse(readFileSync(new URL(`${name}.parsed.json`, corpusDir), "utf8"));
      expect(golden.filter((o) => o.parse_status === "failed"), name).toHaveLength(0);
    }
  });
});
