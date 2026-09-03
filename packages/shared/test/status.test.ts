import { describe, expect, test } from "vitest";
import { fromManila } from "../src/time";
import { resolveStatus, STALE_AFTER_MS } from "../src/status";
import type { Outage } from "../src/types";

const H = 60 * 60 * 1000;

function outage(partial: Partial<Outage> & Pick<Outage, "id" | "start" | "end" | "barangays">): Outage {
  return {
    duration_minutes: Math.round((Date.parse(partial.end) - Date.parse(partial.start)) / 60000),
    lgus: ["cebu-city"],
    unknown_area_tokens: [],
    areas_raw: "Portion of Lahug, Cebu City",
    purpose_raw: "test",
    parse_status: "parsed",
    source_post_url: "https://example.test/post",
    source_published_at: "2026-08-27T09:00:00Z",
    ...partial,
  };
}

// helper: ISO with +08:00 offset
const iso = (y: number, mo: number, d: number, h: number, mi = 0) =>
  `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+08:00`;

const LAHUG = ["cebu-city.lahug"];
const fresh = (now: number) => now - 1 * H;

describe("resolveStatus — PRD §7.1 state machine", () => {
  test("NONE_TODAY when nothing is scheduled at all", () => {
    const now = fromManila(2026, 9, 2, 10);
    const r = resolveStatus([], LAHUG, now, fresh(now));
    expect(r.state).toBe("NONE_TODAY");
    expect(r.nextOutage).toBeUndefined();
    expect(r.isStale).toBe(false);
  });

  test("NONE_TODAY surfaces the soonest future outage as nextOutage", () => {
    const now = fromManila(2026, 9, 2, 10);
    const later = outage({ id: "b", start: iso(2026, 9, 5, 9), end: iso(2026, 9, 5, 17), barangays: LAHUG });
    const sooner = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: LAHUG });
    const r = resolveStatus([later, sooner], LAHUG, now, fresh(now));
    expect(r.state).toBe("NONE_TODAY");
    expect(r.nextOutage?.id).toBe("a");
  });

  test("UPCOMING_TODAY when an outage today has not started", () => {
    const now = fromManila(2026, 9, 3, 6);
    const o = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: LAHUG });
    const r = resolveStatus([o], LAHUG, now, fresh(now));
    expect(r.state).toBe("UPCOMING_TODAY");
    expect(r.activeOutage?.id).toBe("a");
  });

  test("ONGOING when now is inside the scheduled window", () => {
    const now = fromManila(2026, 9, 3, 12);
    const o = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: LAHUG });
    expect(resolveStatus([o], LAHUG, now, fresh(now)).state).toBe("ONGOING");
  });

  test("ENDED_TODAY once every outage today has passed", () => {
    const now = fromManila(2026, 9, 3, 19);
    const o = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: LAHUG });
    const r = resolveStatus([o], LAHUG, now, fresh(now));
    expect(r.state).toBe("ENDED_TODAY");
    expect(r.activeOutage?.id).toBe("a");
  });

  test("FR-24: a cross-midnight outage reads ONGOING on both calendar days", () => {
    const o = outage({ id: "x", start: iso(2026, 8, 30, 22), end: iso(2026, 8, 31, 6), barangays: LAHUG });
    const late30 = fromManila(2026, 8, 30, 23);
    const early31 = fromManila(2026, 8, 31, 3);
    expect(resolveStatus([o], LAHUG, late30, fresh(late30)).state).toBe("ONGOING");
    expect(resolveStatus([o], LAHUG, early31, fresh(early31)).state).toBe("ONGOING");
  });

  test("FR-24: a cross-midnight outage starting tonight is UPCOMING_TODAY this afternoon", () => {
    const o = outage({ id: "x", start: iso(2026, 8, 30, 22), end: iso(2026, 8, 31, 6), barangays: LAHUG });
    const now = fromManila(2026, 8, 30, 15);
    expect(resolveStatus([o], LAHUG, now, fresh(now)).state).toBe("UPCOMING_TODAY");
  });

  test("FR-23: ONGOING beats a later UPCOMING on the same day", () => {
    const now = fromManila(2026, 9, 3, 10);
    const a = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 11), barangays: LAHUG });
    const b = outage({ id: "b", start: iso(2026, 9, 3, 14), end: iso(2026, 9, 3, 16), barangays: LAHUG });
    const r = resolveStatus([b, a], LAHUG, now, fresh(now));
    expect(r.state).toBe("ONGOING");
    expect(r.activeOutage?.id).toBe("a");
    expect(r.todayCount).toBe(2);
  });

  test("FR-23: with two today and the first ended, the soonest UPCOMING wins over ENDED", () => {
    const now = fromManila(2026, 9, 3, 12);
    const a = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 11), barangays: LAHUG });
    const b = outage({ id: "b", start: iso(2026, 9, 3, 14), end: iso(2026, 9, 3, 16), barangays: LAHUG });
    const r = resolveStatus([a, b], LAHUG, now, fresh(now));
    expect(r.state).toBe("UPCOMING_TODAY");
    expect(r.activeOutage?.id).toBe("b");
  });

  test("ignores outages for barangays the user has not selected (FR-35)", () => {
    const now = fromManila(2026, 9, 3, 12);
    const o = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: ["liloan.san-roque"] });
    expect(resolveStatus([o], LAHUG, now, fresh(now)).state).toBe("NONE_TODAY");
  });

  test("matches when any one of several selected barangays is affected", () => {
    const now = fromManila(2026, 9, 3, 12);
    const o = outage({ id: "a", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: ["mandaue-city.basak"] });
    expect(resolveStatus([o], ["cebu-city.lahug", "mandaue-city.basak"], now, fresh(now)).state).toBe("ONGOING");
  });

  test("isStale after 48 hours without a successful fetch (FR-11)", () => {
    const now = fromManila(2026, 9, 3, 12);
    expect(STALE_AFTER_MS).toBe(48 * H);
    expect(resolveStatus([], LAHUG, now, now - 47 * H).isStale).toBe(false);
    expect(resolveStatus([], LAHUG, now, now - 49 * H).isStale).toBe(true);
  });

  test("failed-parse entries never drive the status state, but partial ones do", () => {
    const now = fromManila(2026, 9, 3, 12);
    const failed = outage({ id: "f", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: LAHUG, parse_status: "failed" });
    const partial = outage({ id: "p", start: iso(2026, 9, 3, 9), end: iso(2026, 9, 3, 17), barangays: LAHUG, parse_status: "partial" });
    expect(resolveStatus([failed], LAHUG, now, fresh(now)).state).toBe("NONE_TODAY");
    expect(resolveStatus([partial], LAHUG, now, fresh(now)).state).toBe("ONGOING");
  });
});
