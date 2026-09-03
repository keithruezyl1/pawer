import { describe, expect, test } from "vitest";
import { fromManila } from "@pawer/shared";
import { parseTimeWindow } from "../src/time";

const AUG30 = { start: { year: 2026, month: 8, day: 30 }, end: { year: 2026, month: 8, day: 30 } };
const AUG30_31 = { start: { year: 2026, month: 8, day: 30 }, end: { year: 2026, month: 8, day: 31 } };

describe("parseTimeWindow — ARCH §5.3", () => {
  test("same-day window with whole-hour duration", () => {
    const r = parseTimeWindow("8:00 AM to 4:00 PM (8hrs)", AUG30);
    expect(r).toMatchObject({
      startMs: fromManila(2026, 8, 30, 8, 0),
      endMs: fromManila(2026, 8, 30, 16, 0),
      durationMinutes: 480,
      durationMismatch: false,
    });
  });

  test("explicit 'of <date>' form overrides the header and crosses midnight", () => {
    const r = parseTimeWindow("10:00 PM of August 30 to 6:00 AM of August 31 (8hrs)", AUG30_31);
    expect(r?.startMs).toBe(fromManila(2026, 8, 30, 22, 0));
    expect(r?.endMs).toBe(fromManila(2026, 8, 31, 6, 0));
    expect(r?.durationMinutes).toBe(480);
  });

  test("same-day form with end before start is inferred as crossing midnight", () => {
    const r = parseTimeWindow("10:00 PM to 6:00 AM (8hrs)", AUG30);
    expect(r?.endMs).toBe(fromManila(2026, 8, 31, 6, 0));
  });

  test("decimal-hour duration converts to minutes: 6.17hrs → 370", () => {
    expect(parseTimeWindow("8:50 AM to 3:00 PM (6.17hrs)", AUG30)?.durationMinutes).toBe(370);
  });

  test("unclosed parenthesis '(10hrs' still parses", () => {
    const r = parseTimeWindow("7:00 AM to 5:00 PM (10hrs", AUG30);
    expect(r?.durationMinutes).toBe(600);
    expect(r?.durationMismatch).toBe(false);
  });

  test("missing duration falls back to end − start", () => {
    const r = parseTimeWindow("9:00 AM to 12:00 PM", AUG30);
    expect(r?.durationMinutes).toBe(180);
  });

  test("stated duration disagreeing with the window by more than 2 min is flagged", () => {
    const r = parseTimeWindow("9:00 AM to 12:00 PM (5hrs)", AUG30);
    expect(r?.durationMismatch).toBe(true);
    // the window is authoritative for start/end; the stated duration is kept for display audit
    expect(r?.durationMinutes).toBe(180);
  });

  test("tolerates lowercase meridiem, missing space, and 'hr' singular", () => {
    const r = parseTimeWindow("9:00am to 10:30am (1.5hr)", AUG30);
    expect(r?.startMs).toBe(fromManila(2026, 8, 30, 9, 0));
    expect(r?.durationMinutes).toBe(90);
  });

  test("returns null when no time can be read", () => {
    expect(parseTimeWindow("TBA", AUG30)).toBeNull();
  });
});
