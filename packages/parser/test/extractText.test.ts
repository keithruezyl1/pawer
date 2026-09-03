import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { extractLines } from "../src/extractText";

const html = readFileSync(new URL("../corpus/2026-08-30.html", import.meta.url), "utf8");

describe("extractLines — Wix Ricos table layout, document order", () => {
  const lines = extractLines(html);

  test("produces one line per block, in document order", () => {
    const i = lines.indexOf("August 30, 2026 (Sunday)");
    expect(i).toBeGreaterThanOrEqual(0);
    expect(lines.slice(i, i + 7)).toEqual([
      "August 30, 2026 (Sunday)",
      "Time:",
      "8:00 AM to 4:00 PM (8hrs)",
      "Purpose:",
      "To improve the reliability of the distribution system serving Brgy. Tapul by facilitating extension of secondary lines (line stringing) and extension of primary lines (line stringing).",
      "Areas Affected:",
      "Portion of Tapul, Talisay City, along portion of Tapul Brgy. Road.",
    ]);
  });

  test("finds all 31 'Areas Affected:' labels", () => {
    expect(lines.filter((l) => l === "Areas Affected:")).toHaveLength(31);
  });

  test("keeps the raw U+2011 in Cantao‑an — extraction does not normalise", () => {
    expect(lines.some((l) => l.includes("Cantao‑an"))).toBe(true);
  });

  test("excludes site chrome such as navigation and footer", () => {
    expect(lines).not.toContain("Contact Us");
    expect(lines).not.toContain("Privacy Statement");
  });
});
