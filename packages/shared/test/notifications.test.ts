import { describe, expect, test } from "vitest";
import { fromManila, toIsoManila, type Outage } from "../src/index";
import { deriveLocalNotifications, type AlertPrefs } from "../src/notifications";

const mk = (id: string, s: number, e: number, brgys = ["cebu-city.lahug"], status: Outage["parse_status"] = "parsed"): Outage => ({
  id, start: toIsoManila(s), end: toIsoManila(e), duration_minutes: (e - s) / 60000,
  lgus: ["cebu-city"], barangays: brgys, unknown_area_tokens: [], areas_raw: "", purpose_raw: "",
  parse_status: status, source_post_url: "u", source_published_at: "p",
});
const ALL: AlertPrefs = { eveningBefore: true, hourBefore: true, restoration: true };
const SEL = ["cebu-city.lahug"];
const label = (slugs: string[]) => (slugs.length === 1 ? "Lahug" : `${slugs.length} areas`);
const NOW = fromManila(2026, 9, 2, 10);

describe("deriveLocalNotifications — the three on-device alerts, rebuilt from scratch every refresh (FR-31)", () => {
  test("one outage yields evening-before at 20:00, one-hour-before, and expected-restoration", () => {
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const n = deriveLocalNotifications([o], SEL, ALL, NOW, label);
    expect(n.map((x) => [x.kind, x.fireAtMs])).toEqual([
      ["eveningBefore", fromManila(2026, 9, 3, 20)],
      ["hourBefore", fromManila(2026, 9, 4, 8)],
      ["restoration", fromManila(2026, 9, 4, 17)],
    ]);
  });

  test("copy follows DG §8 exactly, including 'about an hour' for the inexact alarm", () => {
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const [eve, hour, rest] = deriveLocalNotifications([o], SEL, ALL, NOW, label);
    expect(eve).toMatchObject({ title: "Outage tomorrow — Lahug", body: "9:00 AM – 5:00 PM · 8h" });
    expect(hour).toMatchObject({ title: "Outage in about an hour — Lahug", body: "Starts 9:00 AM, expected until 5:00 PM" });
    expect(rest).toMatchObject({ title: "Power should be restored — Lahug", body: "Scheduled outage ended 5:00 PM" });
  });

  test("alerts whose fire time has already passed are not scheduled", () => {
    const o = mk("a", fromManila(2026, 9, 2, 11), fromManila(2026, 9, 2, 13)); // starts in an hour
    const kinds = deriveLocalNotifications([o], SEL, ALL, NOW, label).map((x) => x.kind);
    expect(kinds).toEqual(["restoration"]); // evening-before (yesterday) and hour-before (10:00 == now) are gone
  });

  test("disabled kinds are omitted", () => {
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const kinds = deriveLocalNotifications([o], SEL, { eveningBefore: false, hourBefore: true, restoration: false }, NOW, label).map((x) => x.kind);
    expect(kinds).toEqual(["hourBefore"]);
  });

  test("only selected barangays; failed entries never schedule anything", () => {
    const other = mk("o", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17), ["liloan.tabla"]);
    const failed = mk("f", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17), SEL, "failed");
    expect(deriveLocalNotifications([other, failed], SEL, ALL, NOW, label)).toEqual([]);
  });

  test("14-day horizon and the 64-pending cap, soonest first (FR-32)", () => {
    const many: Outage[] = [];
    for (let d = 1; d <= 40; d++) many.push(mk(`d${d}`, fromManila(2026, 9, 2 + d, 9), fromManila(2026, 9, 2 + d, 17)));
    const n = deriveLocalNotifications(many, SEL, ALL, NOW, label);
    expect(n.length).toBeLessThanOrEqual(64);
    expect(n.every((x) => x.fireAtMs <= NOW + 14 * 86400e3)).toBe(true);
    for (let i = 1; i < n.length; i++) expect(n[i]!.fireAtMs).toBeGreaterThanOrEqual(n[i - 1]!.fireAtMs);
  });

  test("keys are deterministic so a rebuild replaces, never duplicates", () => {
    const o = mk("a", fromManila(2026, 9, 4, 9), fromManila(2026, 9, 4, 17));
    const a = deriveLocalNotifications([o], SEL, ALL, NOW, label).map((x) => x.key);
    const b = deriveLocalNotifications([o], SEL, ALL, NOW, label).map((x) => x.key);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
  });

  test("a cross-midnight outage: evening-before is the evening before the START day", () => {
    const o = mk("x", fromManila(2026, 9, 4, 22), fromManila(2026, 9, 5, 6));
    const eve = deriveLocalNotifications([o], SEL, ALL, NOW, label).find((x) => x.kind === "eveningBefore")!;
    expect(eve.fireAtMs).toBe(fromManila(2026, 9, 3, 20));
    expect(eve.body).toBe("10:00 PM Fri – 6:00 AM Sat · 8h");
  });
});
