import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { extractLines } from "../src/extractText";
import { segment, parseDayHeader } from "../src/segment";

const lines = extractLines(readFileSync(new URL("../corpus/2026-08-30.html", import.meta.url), "utf8"));

describe("parseDayHeader", () => {
  test("single day", () => {
    expect(parseDayHeader("August 30, 2026 (Sunday)")).toEqual({
      start: { year: 2026, month: 8, day: 30 }, end: { year: 2026, month: 8, day: 30 },
    });
  });
  test("range within a month", () => {
    expect(parseDayHeader("August 30-31, 2026 (Sunday-Monday)")).toEqual({
      start: { year: 2026, month: 8, day: 30 }, end: { year: 2026, month: 8, day: 31 },
    });
  });
  test("range across a month boundary", () => {
    expect(parseDayHeader("August 31-September 1, 2026 (Monday-Tuesday)")).toEqual({
      start: { year: 2026, month: 8, day: 31 }, end: { year: 2026, month: 9, day: 1 },
    });
  });
  test("tolerates an en dash and stray spaces", () => {
    expect(parseDayHeader("September 3 – 4, 2026 (Thursday-Friday)")?.end.day).toBe(4);
  });
  test("rejects non-headers", () => {
    expect(parseDayHeader("Time:")).toBeNull();
    expect(parseDayHeader("Portion of Tapul, Talisay City")).toBeNull();
  });
});

describe("segment — ARCH §5.2", () => {
  const groups = segment(lines);

  test("yields 31 entries across the day groups", () => {
    expect(groups.flatMap((g) => g.entries)).toHaveLength(31);
  });

  test("first group is Aug 30 with three entries", () => {
    expect(groups[0]?.header?.start).toEqual({ year: 2026, month: 8, day: 30 });
    expect(groups[0]?.entries).toHaveLength(3);
  });

  test("each entry carries the three text fields and drops Map", () => {
    const e = groups[0]!.entries[0]!;
    expect(e.time).toBe("8:00 AM to 4:00 PM (8hrs)");
    expect(e.purpose).toMatch(/^To improve the reliability/);
    expect(e.areas).toBe("Portion of Tapul, Talisay City, along portion of Tapul Brgy. Road.");
    expect(e).not.toHaveProperty("map");
  });

  test("survives the leading-space label defect (' Time:')", () => {
    const withDefect = ["August 25, 2026 (Tuesday)", " Time:", "9:00 AM to 3:00 PM (6hrs)", "Purpose:", "x", "Areas Affected:", "Portion of Jaclupan, Talisay City", "Map:"];
    expect(segment(withDefect)[0]?.entries).toHaveLength(1);
  });

  test("an empty 'Map:' value line does not break the next entry", () => {
    const g = segment(lines);
    const aug30_31 = g.find((x) => x.header?.end.day === 31 && x.header?.start.day === 30);
    expect(aug30_31?.entries[0]?.time).toBe("10:00 PM of August 30 to 6:00 AM of August 31 (8hrs)");
  });
});
