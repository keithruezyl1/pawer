import { describe, expect, test } from "vitest";
import {
  PH_OFFSET_MS,
  fromManila,
  manilaParts,
  manilaMidnight,
  manilaDateKey,
  formatTime12h,
  formatWindow,
  formatDuration,
  formatDateShort,
} from "../src/time";

// 2026-08-30T22:00 Manila == 2026-08-30T14:00Z
const AUG30_2200 = Date.UTC(2026, 7, 30, 14, 0, 0);

describe("fixed +08:00 offset, no tz database", () => {
  test("offset constant is eight hours", () => {
    expect(PH_OFFSET_MS).toBe(8 * 60 * 60 * 1000);
  });

  test("fromManila builds an instant from Manila wall-clock parts", () => {
    expect(fromManila(2026, 8, 30, 22, 0)).toBe(AUG30_2200);
  });

  test("manilaParts decomposes an instant into Manila wall-clock parts", () => {
    expect(manilaParts(AUG30_2200)).toEqual({
      year: 2026, month: 8, day: 30, hour: 22, minute: 0, second: 0, weekday: 0,
    });
  });

  test("manilaMidnight snaps to 00:00 Manila of the same Manila day, even when UTC date differs", () => {
    // 2026-08-31T01:00 Manila == 2026-08-30T17:00Z — UTC still says the 30th
    const aug31_0100 = fromManila(2026, 8, 31, 1, 0);
    expect(manilaMidnight(aug31_0100)).toBe(fromManila(2026, 8, 31, 0, 0));
  });

  test("manilaDateKey yields YYYY-MM-DD in Manila", () => {
    expect(manilaDateKey(fromManila(2026, 9, 3, 0, 30))).toBe("2026-09-03");
  });
});

describe("display formatting (DG §2.2)", () => {
  test("12-hour, uppercase meridiem, no leading zero", () => {
    expect(formatTime12h(fromManila(2026, 8, 30, 8, 0))).toBe("8:00 AM");
    expect(formatTime12h(fromManila(2026, 8, 30, 22, 30))).toBe("10:30 PM");
    expect(formatTime12h(fromManila(2026, 8, 30, 0, 5))).toBe("12:05 AM");
    expect(formatTime12h(fromManila(2026, 8, 30, 12, 0))).toBe("12:00 PM");
  });

  test("same-day window uses a spaced en dash", () => {
    expect(formatWindow(fromManila(2026, 8, 30, 8, 0), fromManila(2026, 8, 30, 16, 0)))
      .toBe("8:00 AM – 4:00 PM");
  });

  test("cross-midnight window names both days", () => {
    expect(formatWindow(fromManila(2026, 8, 30, 22, 0), fromManila(2026, 8, 31, 6, 0)))
      .toBe("10:00 PM Sun – 6:00 AM Mon");
  });

  test("duration is hours and minutes, never decimal", () => {
    expect(formatDuration(480)).toBe("8h");
    expect(formatDuration(370)).toBe("6h 10m");
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(45)).toBe("45m");
  });

  test("date short form says Today / Tomorrow / 'Thu, Sep 3'", () => {
    const now = fromManila(2026, 9, 2, 10, 0);
    expect(formatDateShort(fromManila(2026, 9, 2, 23, 0), now)).toBe("Today");
    expect(formatDateShort(fromManila(2026, 9, 3, 1, 0), now)).toBe("Tomorrow");
    expect(formatDateShort(fromManila(2026, 9, 3, 9, 0), fromManila(2026, 9, 1, 9, 0))).toBe("Thu, Sep 3");
  });
});
