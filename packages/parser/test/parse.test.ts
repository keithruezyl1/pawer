import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fromManila } from "@pawer/shared";
import { parseAdvisory } from "../src/index";

const META = {
  postUrl: "https://www.visayanelectric.com/post/service-interruption-august-30-september-5-2026",
  publishedAt: "2026-08-27T09:12:00Z",
};
const html = readFileSync(new URL("../corpus/2026-08-30.html", import.meta.url), "utf8");

describe("parseAdvisory — end to end on a real advisory", () => {
  const outages = parseAdvisory(html, META);

  test("every one of the 31 entries becomes an outage; none is silently dropped (NFR-21)", () => {
    expect(outages).toHaveLength(31);
    expect(outages.filter((o) => o.parse_status === "failed")).toHaveLength(0);
  });

  test("at least 30 of 31 reach 'parsed'", () => {
    expect(outages.filter((o) => o.parse_status === "parsed").length).toBeGreaterThanOrEqual(30);
  });

  test("the first entry is Tapul, Talisay, 8h", () => {
    expect(outages[0]).toMatchObject({
      start: "2026-08-30T08:00:00+08:00",
      end: "2026-08-30T16:00:00+08:00",
      duration_minutes: 480,
      lgus: ["talisay-city"],
      barangays: ["talisay-city.tapul"],
      parse_status: "parsed",
      source_post_url: META.postUrl,
      source_published_at: META.publishedAt,
    });
  });

  test("cross-midnight entry stores absolute instants (FR-24)", () => {
    const x = outages.find((o) => o.start === "2026-08-30T22:00:00+08:00");
    expect(x?.end).toBe("2026-08-31T06:00:00+08:00");
    expect(Date.parse(x!.end) - Date.parse(x!.start)).toBe(8 * 3600e3);
    expect(x?.barangays.sort()).toEqual(["cebu-city.camputhaw", "cebu-city.capitol-site", "cebu-city.lahug", "cebu-city.san-roque"]);
  });

  test("Colon appears three times that week; the two Sep 1 entries are distinct outages with distinct ids", () => {
    const colon = outages.filter((o) => o.barangays.includes("naga.colon"));
    expect(colon).toHaveLength(3);
    const sep1 = colon.filter((o) => o.start.startsWith("2026-09-01"));
    expect(sep1).toHaveLength(2);
    expect(sep1[0]!.id).not.toBe(sep1[1]!.id);
    expect(sep1.map((o) => o.start).sort()).toEqual(["2026-09-01T08:50:00+08:00", "2026-09-01T09:00:00+08:00"]);
  });

  test("decimal duration is stored as minutes", () => {
    expect(outages.find((o) => o.start === "2026-09-01T08:50:00+08:00")?.duration_minutes).toBe(370);
  });

  test("the multi-LGU Naga & Minglanilla entry attributes Camp 8 to Minglanilla", () => {
    const o = outages.find((x) => x.barangays.includes("minglanilla.camp-8"));
    expect(o?.lgus.sort()).toEqual(["minglanilla", "naga"]);
    expect(o?.barangays.filter((b) => b.startsWith("naga."))).toHaveLength(12);
  });

  test("raw text is preserved verbatim after normalisation, typos included", () => {
    const o = outages.find((x) => x.areas_raw.includes("Escario Strett"));
    expect(o).toBeDefined();
  });

  test("ids are stable: parsing twice yields identical ids", () => {
    const again = parseAdvisory(html, META);
    expect(again.map((o) => o.id)).toEqual(outages.map((o) => o.id));
    expect(new Set(outages.map((o) => o.id)).size).toBe(31);
  });

  test("ids are 16 lowercase hex chars", () => {
    for (const o of outages) expect(o.id).toMatch(/^[0-9a-f]{16}$/);
  });

  test("Manila arithmetic agrees with @pawer/shared", () => {
    expect(Date.parse(outages[0]!.start)).toBe(fromManila(2026, 8, 30, 8, 0));
  });
});

describe("parse_status rules — ARCH §5.5", () => {
  const wrap = (body: string) =>
    `<html><body><main data-main-content-parent="true"><div data-hook="post-description">${body}</div></main></body></html>`;
  const p = (s: string) => `<p>${s}</p>`;
  const entry = (time: string, areas: string) =>
    p("August 30, 2026 (Sunday)") + p("Time:") + p(time) + p("Purpose:") + p("x") + p("Areas Affected:") + p(areas) + p("Map:");

  test("unreadable time → failed, but the entry is still emitted", () => {
    const [o] = parseAdvisory(wrap(entry("TBA", "Portion of Lahug, Cebu City, along X")), META);
    expect(o?.parse_status).toBe("failed");
    expect(o?.areas_raw).toContain("Lahug");
  });

  test("unknown area token → partial, resolved barangays kept", () => {
    const [o] = parseAdvisory(wrap(entry("8:00 AM to 4:00 PM (8hrs)", "Portion of Lahug & Zzyzx, Cebu City, along X")), META);
    expect(o?.parse_status).toBe("partial");
    expect(o?.barangays).toEqual(["cebu-city.lahug"]);
    expect(o?.unknown_area_tokens).toEqual(["Zzyzx"]);
  });

  test("same-LGU ambiguity fan-out → partial (R12)", () => {
    const [o] = parseAdvisory(wrap(entry("8:00 AM to 4:00 PM (8hrs)", "Portion of Basak, Cebu City, along X")), META);
    expect(o?.parse_status).toBe("partial");
    expect(o?.barangays).toHaveLength(2);
  });

  test("duration mismatch → partial", () => {
    const [o] = parseAdvisory(wrap(entry("9:00 AM to 12:00 PM (5hrs)", "Portion of Lahug, Cebu City, along X")), META);
    expect(o?.parse_status).toBe("partial");
  });

  test("no LGU detected → partial with the head reported unknown", () => {
    const [o] = parseAdvisory(wrap(entry("8:00 AM to 4:00 PM (8hrs)", "Portion of Lahug, along X")), META);
    expect(o?.parse_status).toBe("partial");
    expect(o?.unknown_area_tokens).toEqual(["Lahug"]);
  });
});
