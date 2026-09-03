import { describe, expect, test } from "vitest";
import { fromManila, toIsoManila, type Outage } from "@pawer/shared";
import { mergeOutages, selectToNotify, topicsFor } from "../src/merge";

const mk = (id: string, post: string, startMs: number, hours: number, brgys = ["cebu-city.lahug"], status: Outage["parse_status"] = "parsed"): Outage => ({
  id, start: toIsoManila(startMs), end: toIsoManila(startMs + hours * 3600e3), duration_minutes: hours * 60,
  lgus: [...new Set(brgys.map((b) => b.split(".")[0]!))], barangays: brgys, unknown_area_tokens: [],
  areas_raw: "x", purpose_raw: "y", parse_status: status, source_post_url: post, source_published_at: "2026-08-27T00:00:00Z",
});

const NOW = fromManila(2026, 9, 3, 10);
const A = "https://x/post/a";
const B = "https://x/post/b";

describe("mergeOutages — a post is the unit of truth", () => {
  test("replaces every outage from a re-parsed post, keeps other posts' outages", () => {
    const existing = [mk("a1", A, fromManila(2026, 9, 4, 9), 8), mk("b1", B, fromManila(2026, 9, 5, 9), 8)];
    const incoming = [mk("a2", A, fromManila(2026, 9, 4, 10), 6)];
    const out = mergeOutages(existing, incoming, NOW);
    expect(out.map((o) => o.id).sort()).toEqual(["a2", "b1"]);
  });

  test("drops outages that ended more than 30 days ago", () => {
    const old = mk("old", B, fromManila(2026, 7, 1, 9), 8);
    const recent = mk("recent", B, fromManila(2026, 8, 20, 9), 8);
    const out = mergeOutages([old, recent], [], NOW);
    expect(out.map((o) => o.id)).toEqual(["recent"]);
  });

  test("keeps failed entries too — they are shown, never dropped (NFR-21)", () => {
    const f = mk("f", A, fromManila(2026, 9, 4, 0), 0, ["cebu-city.lahug"], "failed");
    expect(mergeOutages([], [f], NOW).map((o) => o.id)).toEqual(["f"]);
  });

  test("output is sorted by start", () => {
    const out = mergeOutages([], [mk("late", A, fromManila(2026, 9, 6, 9), 1), mk("early", A, fromManila(2026, 9, 4, 9), 1)], NOW);
    expect(out.map((o) => o.id)).toEqual(["early", "late"]);
  });
});

describe("selectToNotify — which outages trigger a 'new advisory' push", () => {
  test("future, resolvable, not-yet-notified outages only", () => {
    const future = mk("fut", A, fromManila(2026, 9, 4, 9), 8);
    const past = mk("past", A, fromManila(2026, 9, 1, 9), 8);
    const done = mk("done", A, fromManila(2026, 9, 5, 9), 8);
    const failed = mk("bad", A, fromManila(2026, 9, 5, 0), 0, ["cebu-city.lahug"], "failed");
    const noArea = { ...mk("na", A, fromManila(2026, 9, 5, 9), 8), barangays: [] as string[], parse_status: "partial" as const };
    const sel = selectToNotify([future, past, done, failed, noArea], ["done"], NOW);
    expect(sel.map((o) => o.id)).toEqual(["fut"]);
  });

  test("partial entries with at least one resolved barangay DO notify (§5.5)", () => {
    const p = mk("p", A, fromManila(2026, 9, 4, 9), 8, ["cebu-city.lahug"], "partial");
    expect(selectToNotify([p], [], NOW).map((o) => o.id)).toEqual(["p"]);
  });
});

describe("topicsFor — veco.v1.{lgu}.{barangay}, barangay level only (D-17)", () => {
  test("one topic per barangay, never an LGU topic", () => {
    const o = mk("t", A, NOW, 1, ["cebu-city.lahug", "liloan.san-roque"]);
    expect(topicsFor(o)).toEqual(["veco.v1.cebu-city.lahug", "veco.v1.liloan.san-roque"]);
  });

  test("topic names satisfy FCM's [a-zA-Z0-9-_.~%]+", () => {
    for (const t of topicsFor(mk("t", A, NOW, 1, ["naga.cantao-an", "minglanilla.camp-8", "cebu-city.t-padilla"]))) {
      expect(t).toMatch(/^[a-zA-Z0-9\-_.~%]+$/);
    }
  });
});
