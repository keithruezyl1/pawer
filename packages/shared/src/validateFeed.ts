/**
 * Validates an advisories payload before anything trusts it.
 *
 * Lives here rather than in the app because both ends need it: the app treats the published file
 * as data off the public internet, and the pipeline can check its own output before publishing so
 * a malformed feed never ships in the first place.
 */
import type { AdvisoriesFile, Outage, ParseStatus } from "./types";

const PARSE_STATUSES: readonly ParseStatus[] = ["parsed", "partial", "failed"];

export type FeedRejection = "malformed" | "outdated";

export type FeedValidation =
  | { ok: true; file: AdvisoriesFile }
  | { ok: false; reason: FeedRejection; code: string };

/** Everything a consumer reads off an outage, checked before any of it reaches a screen. */
export function isOutage(v: unknown): v is Outage {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  const str = (k: string) => typeof o[k] === "string";
  const strs = (k: string) => Array.isArray(o[k]) && (o[k] as unknown[]).every((x) => typeof x === "string");
  return (
    str("id") && str("start") && str("end") && str("areas_raw") && str("purpose_raw") &&
    str("source_post_url") && str("source_published_at") &&
    typeof o.duration_minutes === "number" &&
    strs("lgus") && strs("barangays") && strs("unknown_area_tokens") &&
    PARSE_STATUSES.includes(o.parse_status as ParseStatus)
  );
}

/**
 * A malformed feed is rejected WHOLE, never partly. Dropping the entries that fail validation
 * would be a silent false negative, and an outage nobody hears about is the one failure this
 * product cannot have — better to keep yesterday's data and say so.
 *
 * `supported` is the reader's own schema version. A feed above it means the reader is out of date,
 * which is a different problem from a broken feed and gets a different screen.
 */
export function validateAdvisories(body: unknown, supported: number): FeedValidation {
  if (typeof body !== "object" || body === null) return { ok: false, reason: "malformed", code: "not-an-object" };
  const f = body as Record<string, unknown>;

  const version = f.schema_version;
  if (typeof version !== "number") return { ok: false, reason: "malformed", code: "no-schema-version" };
  if (version > supported) return { ok: false, reason: "outdated", code: `schema ${version}` };
  if (version < supported) return { ok: false, reason: "malformed", code: `schema ${version}` };

  if (!Array.isArray(f.outages)) return { ok: false, reason: "malformed", code: "no-outages" };
  const bad = f.outages.findIndex((o) => !isOutage(o));
  if (bad !== -1) return { ok: false, reason: "malformed", code: `entry ${bad}` };

  return { ok: true, file: f as unknown as AdvisoriesFile };
}
