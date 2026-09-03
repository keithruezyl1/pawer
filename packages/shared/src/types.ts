/** Data contracts shared by the pipeline, the parser, and the app. ARCHITECTURE.md §6. */

export type ParseStatus = "parsed" | "partial" | "failed";

export interface Outage {
  /** sha256(source_post_url + start + end + areas_raw), first 16 hex chars. Stable across re-parses. */
  id: string;
  /** Absolute instant, ISO 8601 with +08:00 offset. Never a date plus time-of-day (FR-24). */
  start: string;
  end: string;
  duration_minutes: number;
  /** LGU slugs, e.g. "cebu-city". */
  lgus: string[];
  /** Fully qualified barangay slugs, e.g. "cebu-city.lahug" (R8). */
  barangays: string[];
  /** Head tokens that matched no registry entry (NFR-22). */
  unknown_area_tokens: string[];
  /** Verbatim after normalisation. Typos are VECO's. */
  areas_raw: string;
  purpose_raw: string;
  parse_status: ParseStatus;
  source_post_url: string;
  source_published_at: string;
}

export interface AdvisoriesFile {
  schema_version: 1;
  generated_at: string;
  source_attribution: string;
  outages: Outage[];
}

export interface LguEntry {
  slug: string;
  display: string;
  psgc: string | null;
  aliases: string[];
}

export interface BarangayEntry {
  slug: string;
  display: string;
  lgu: string;
  aliases: string[];
  /** 9-digit PSGC barangay code — the authority (R1). */
  psgc: string | null;
  /** PSGC's own spelling, e.g. "Camputhaw (Pob.)"; display strips the poblacion marker. */
  psgc_name?: string;
  psgc_old_name?: string | null;
  verified_against: string;
  ambiguous_across_lgus: boolean;
  same_lgu_substring_of: string[];
}

export interface Registry {
  lgus: LguEntry[];
  barangays: BarangayEntry[];
}

export type WidgetStateName = "NONE_TODAY" | "UPCOMING_TODAY" | "ONGOING" | "ENDED_TODAY";

/** Precomputed blob the app writes for the widget (ARCH §9.2). */
export interface WidgetState {
  state: WidgetStateName;
  label: string;
  primary_until_ms: number | null;
  secondary: string;
  area_label: string;
  next_start_ms: number | null;
  fetched_at_ms: number;
  boundaries_ms: number[];
}
