/**
 * parseAdvisory: one VECO advisory page → Outage[]. Pure — HTML string in, records out.
 * Never drops an entry (NFR-21): every segmented entry becomes an outage with a parse_status.
 */
import { fromManila, toIsoManila, type Outage, type ParseStatus, type Registry } from "@pawer/shared";
import { extractLines } from "./extractText";
import { segment } from "./segment";
import { parseTimeWindow } from "./time";
import { resolveAreas } from "./areas";
import { outageId } from "./id";

export interface AdvisoryMeta {
  postUrl: string;
  publishedAt: string;
}

export function parseAdvisory(html: string, meta: AdvisoryMeta, registry?: Registry): Outage[] {
  const groups = segment(extractLines(html));
  const out: Outage[] = [];

  for (const group of groups) {
    for (const entry of group.entries) {
      const window = parseTimeWindow(entry.time, group.header);
      const areas = resolveAreas(entry.areas, registry);

      let start: string;
      let end: string;
      let durationMinutes: number;
      let status: ParseStatus;

      if (window) {
        start = toIsoManila(window.startMs);
        end = toIsoManila(window.endMs);
        durationMinutes = window.durationMinutes;
        const incomplete =
          areas.lgus.length === 0 ||
          areas.barangays.length === 0 ||
          areas.unknownTokens.length > 0 ||
          areas.ambiguous ||
          window.durationMismatch;
        status = incomplete ? "partial" : "parsed";
      } else {
        // Unreadable time: pin to the day header (or publication) so the entry still sorts sensibly.
        const h = group.header?.start;
        const dayMs = h ? fromManila(h.year, h.month, h.day) : Date.parse(meta.publishedAt);
        start = toIsoManila(dayMs);
        end = start;
        durationMinutes = 0;
        status = "failed";
      }

      out.push({
        id: outageId(meta.postUrl, start, end, entry.areas),
        start,
        end,
        duration_minutes: durationMinutes,
        lgus: areas.lgus,
        barangays: areas.barangays,
        unknown_area_tokens: areas.unknownTokens,
        areas_raw: entry.areas,
        purpose_raw: entry.purpose,
        parse_status: status,
        source_post_url: meta.postUrl,
        source_published_at: meta.publishedAt,
      });
    }
  }

  return out;
}

export { extractLines } from "./extractText";
export { segment, parseDayHeader } from "./segment";
export { parseTimeWindow } from "./time";
export { resolveAreas, splitHeadTail } from "./areas";
export { normalizeText, foldForMatch } from "./normalize";
export { outageId } from "./id";
