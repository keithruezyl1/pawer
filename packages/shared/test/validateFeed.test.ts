import { describe, expect, test } from "vitest";
import { validateAdvisories, isOutage } from "../src/validateFeed";
import type { Outage } from "../src/types";

const outage: Outage = {
  id: "abc123", start: "2026-09-06T09:00:00+08:00", end: "2026-09-06T17:00:00+08:00",
  duration_minutes: 480, lgus: ["cebu-city"], barangays: ["cebu-city.lahug"],
  unknown_area_tokens: [], areas_raw: "Portion of Lahug, Cebu City", purpose_raw: "Maintenance",
  parse_status: "parsed", source_post_url: "https://example.test/post/x",
  source_published_at: "2026-09-03T09:02:24.000Z",
};
const file = (over: Record<string, unknown> = {}) =>
  ({ schema_version: 1, generated_at: "2026-09-04T09:24:10Z", source_attribution: "Visayan Electric", outages: [outage], ...over });

describe("validateAdvisories — the trust boundary on the published feed", () => {
  test("accepts a well-formed file", () => {
    const r = validateAdvisories(file(), 1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.outages).toHaveLength(1);
  });

  test("a NEWER schema is 'outdated' — the reader is behind, not the feed broken", () => {
    expect(validateAdvisories(file({ schema_version: 2 }), 1)).toMatchObject({ ok: false, reason: "outdated", code: "schema 2" });
  });

  test("an OLDER schema is malformed — the publisher went backwards, which is our bug", () => {
    expect(validateAdvisories(file({ schema_version: 0 }), 1)).toMatchObject({ ok: false, reason: "malformed" });
  });

  test.each([
    ["not an object", "nope", "not-an-object"],
    ["null", null, "not-an-object"],
    ["no schema_version", { outages: [] }, "no-schema-version"],
    ["outages not an array", { schema_version: 1, outages: {} }, "no-outages"],
  ])("rejects %s", (_label, body, code) => {
    expect(validateAdvisories(body, 1)).toMatchObject({ ok: false, reason: "malformed", code });
  });

  test("ONE bad entry rejects the whole file, and names which", () => {
    const r = validateAdvisories(file({ outages: [outage, { id: "x" }, outage] }), 1);
    expect(r).toMatchObject({ ok: false, reason: "malformed", code: "entry 1" });
  });

  // Dropping bad entries and keeping the rest would hide an outage from the person it affects.
  // Yesterday's complete data beats today's partial data (FR-18).
  test("never returns a partial list", () => {
    const r = validateAdvisories(file({ outages: [outage, null] }), 1);
    expect(r.ok).toBe(false);
  });

  describe("isOutage guards every field the UI reads", () => {
    test.each([
      "id", "start", "end", "areas_raw", "purpose_raw", "source_post_url", "source_published_at",
    ])("a missing %s is rejected", (field) => {
      const { [field as keyof Outage]: _drop, ...rest } = outage;
      expect(isOutage(rest)).toBe(false);
    });

    test("duration_minutes must be a number, not a numeric string", () => {
      expect(isOutage({ ...outage, duration_minutes: "480" })).toBe(false);
    });

    test("an unknown parse_status is rejected", () => {
      expect(isOutage({ ...outage, parse_status: "guessed" })).toBe(false);
    });

    test("barangays must be strings", () => {
      expect(isOutage({ ...outage, barangays: [1, 2] })).toBe(false);
    });
  });
});
