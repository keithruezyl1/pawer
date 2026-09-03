import { describe, expect, test } from "vitest";
import { fromManila, resolveStatus, toIsoManila, type Outage } from "../src/index";
import { deriveWidgetState } from "../src/widgetState";

const mk = (id: string, s: number, e: number, brgys = ["cebu-city.lahug"]): Outage => ({
  id, start: toIsoManila(s), end: toIsoManila(e), duration_minutes: (e - s) / 60000,
  lgus: ["cebu-city"], barangays: brgys, unknown_area_tokens: [], areas_raw: "", purpose_raw: "",
  parse_status: "parsed", source_post_url: "u", source_published_at: "p",
});
const label = (slugs: string[]) => (slugs.length === 1 ? "Lahug" : `${slugs.length} areas`);
const SEL = ["cebu-city.lahug"];
const fresh = (now: number) => now - 3600e3;

describe("deriveWidgetState — the precomputed blob the Kotlin widget reads (ARCH §9.2)", () => {
  test("NONE_TODAY with a future outage points the widget at NEXT", () => {
    const now = fromManila(2026, 9, 2, 10);
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const w = deriveWidgetState(resolveStatus([o], SEL, now, fresh(now)), SEL, now, fresh(now), label);
    expect(w).toMatchObject({ state: "NONE_TODAY", label: "NEXT", primary_until_ms: null, secondary: "Fri · 9:00 AM – 5:00 PM", area_label: "Lahug", next_start_ms: fromManila(2026, 9, 4, 9) });
  });

  test("UPCOMING_TODAY counts down to the start", () => {
    const now = fromManila(2026, 9, 4, 6);
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const w = deriveWidgetState(resolveStatus([o], SEL, now, fresh(now)), SEL, now, fresh(now), label);
    expect(w).toMatchObject({ state: "UPCOMING_TODAY", label: "TODAY", primary_until_ms: fromManila(2026, 9, 4, 9), secondary: "until 9:00 AM" });
  });

  test("ONGOING counts down to expected restoration", () => {
    const now = fromManila(2026, 9, 4, 12);
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const w = deriveWidgetState(resolveStatus([o], SEL, now, fresh(now)), SEL, now, fresh(now), label);
    expect(w).toMatchObject({ state: "ONGOING", label: "NOW", primary_until_ms: fromManila(2026, 9, 4, 17), secondary: "until 5:00 PM" });
  });

  test("ENDED_TODAY has no countdown and honest copy", () => {
    const now = fromManila(2026, 9, 4, 19);
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const w = deriveWidgetState(resolveStatus([o], SEL, now, fresh(now)), SEL, now, fresh(now), label);
    expect(w).toMatchObject({ state: "ENDED_TODAY", label: "TODAY", primary_until_ms: null, secondary: "Should be back by now" });
  });

  test("boundaries are exactly the wakeups the widget needs: next midnight, plus start/end of the active outage", () => {
    const now = fromManila(2026, 9, 4, 6);
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const w = deriveWidgetState(resolveStatus([o], SEL, now, fresh(now)), SEL, now, fresh(now), label);
    expect(w.boundaries_ms).toEqual([fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17), fromManila(2026, 9, 5, 0)]);
  });

  test("a quiet day has exactly one boundary — local midnight (FR-26)", () => {
    const now = fromManila(2026, 9, 2, 10);
    const w = deriveWidgetState(resolveStatus([], SEL, now, fresh(now)), SEL, now, fresh(now), label);
    expect(w.boundaries_ms).toEqual([fromManila(2026, 9, 3, 0)]);
    expect(w.secondary).toBe("No scheduled outage");
    expect(w.label).toBe("TODAY");
  });

  test("multiple selected areas collapse to a count; 'TODAY 1/2' when two outages are today", () => {
    const now = fromManila(2026, 9, 4, 6);
    const a = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 11), ["cebu-city.lahug", "liloan.tabla"]);
    const b = mk("b", fromManila(2026, 9, 4, 14), fromManila(2026, 9, 4, 16), ["cebu-city.lahug"]);
    const sel = ["cebu-city.lahug", "liloan.tabla"];
    const w = deriveWidgetState(resolveStatus([a, b], sel, now, fresh(now)), sel, now, fresh(now), label);
    expect(w.label).toBe("TODAY 1/2");
    expect(w.area_label).toBe("2 areas");
  });

  test("carries fetched_at so the widget can render STALE itself", () => {
    const now = fromManila(2026, 9, 2, 10);
    const w = deriveWidgetState(resolveStatus([], SEL, now, now - 49 * 3600e3), SEL, now, now - 49 * 3600e3, label);
    expect(w.fetched_at_ms).toBe(now - 49 * 3600e3);
  });
});
