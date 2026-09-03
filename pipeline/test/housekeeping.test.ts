import { describe, expect, test } from "vitest";
import { fromManila, toIsoManila } from "@pawer/shared";
import { needsHeartbeat } from "../src/heartbeat";
import { staleBarangays, updateCoverage } from "../src/coverage";
import { filterAlreadyOpen, formatUnknownAreaIssue } from "../src/issues";

describe("needsHeartbeat — one commit per Manila calendar day keeps the workflow alive (NFR-23)", () => {
  test("true when the last commit was on a different Manila day", () => {
    expect(needsHeartbeat(toIsoManila(fromManila(2026, 9, 2, 23, 50)), fromManila(2026, 9, 3, 0, 10))).toBe(true);
  });
  test("false when a commit already happened today", () => {
    expect(needsHeartbeat(toIsoManila(fromManila(2026, 9, 3, 1)), fromManila(2026, 9, 3, 23))).toBe(false);
  });
  test("true when there has never been a commit", () => {
    expect(needsHeartbeat(null, fromManila(2026, 9, 3, 12))).toBe(true);
  });
});

describe("coverage — the only false-negative detector (R9)", () => {
  const now = fromManila(2026, 9, 3, 12);
  const outage = (brgys: string[], startMs: number) => ({ barangays: brgys, start: toIsoManila(startMs), parse_status: "parsed" as const });

  test("records the latest start date seen per barangay", () => {
    const cov = updateCoverage({}, [outage(["cebu-city.lahug"], fromManila(2026, 9, 2, 9)), outage(["cebu-city.lahug"], fromManila(2026, 9, 4, 9))]);
    expect(cov["cebu-city.lahug"]).toBe(toIsoManila(fromManila(2026, 9, 4, 9)));
  });

  test("never moves a last-seen date backwards", () => {
    const cov = updateCoverage({ "cebu-city.lahug": toIsoManila(fromManila(2026, 9, 9, 9)) }, [outage(["cebu-city.lahug"], fromManila(2026, 9, 2, 9))]);
    expect(cov["cebu-city.lahug"]).toBe(toIsoManila(fromManila(2026, 9, 9, 9)));
  });

  test("flags barangays never seen or not seen for 12 weeks; ignores the rest", () => {
    const cov = {
      "cebu-city.lahug": toIsoManila(fromManila(2026, 9, 1, 9)),
      "naga.colon": toIsoManila(fromManila(2026, 5, 1, 9)),
    };
    const flagged = staleBarangays(cov, ["cebu-city.lahug", "naga.colon", "liloan.tabla"], now);
    expect(flagged.sort()).toEqual(["liloan.tabla", "naga.colon"]);
  });
});

describe("issues — unknown-area tokens become de-duplicated GitHub issues (NFR-22)", () => {
  test("title is stable and body carries the evidence", () => {
    const iss = formatUnknownAreaIssue("Royale Cebu Estates", {
      areas_raw: "Portion of Royale Cebu Estates, Casili, Consolacion, along X",
      source_post_url: "https://www.visayanelectric.com/post/service-interruption-august-23-29-2026",
      start: "2026-08-27T09:30:00+08:00",
      lgus: ["consolacion"],
      barangays: ["consolacion.casili"],
    });
    expect(iss.title).toBe('Unknown area: "Royale Cebu Estates"');
    expect(iss.body).toContain("Royale Cebu Estates");
    expect(iss.body).toContain("consolacion");
    expect(iss.body).toContain("service-interruption-august-23-29-2026");
    expect(iss.labels).toEqual(["unknown-area"]);
  });

  test("tokens whose issue is already open are skipped, case-insensitively", () => {
    const wanted = [formatUnknownAreaIssue("Foo", base), formatUnknownAreaIssue("Bar", base)];
    const remaining = filterAlreadyOpen(wanted, ['unknown area: "foo"']);
    expect(remaining.map((i) => i.title)).toEqual(['Unknown area: "Bar"']);
  });
});

const base = { areas_raw: "x", source_post_url: "https://x/post/p", start: "2026-09-01T00:00:00+08:00", lgus: [], barangays: [] };
