/**
 * "Time:" value → absolute window (ARCH §5.3).
 *
 *   8:00 AM to 4:00 PM (8hrs)                                  same-day form
 *   10:00 PM of August 30 to 6:00 AM of August 31 (8hrs)       explicit form — its dates win
 *
 * Same-day form with end <= start crosses midnight. The stated "(Nhrs)" is cross-checked against
 * end − start; a disagreement beyond two minutes is flagged rather than trusted either way.
 */
import { fromManila } from "@pawer/shared";
import { normalizeText } from "./normalize";
import { monthIndex, MONTHS, type DayHeader } from "./segment";

export interface TimeWindow {
  startMs: number;
  endMs: number;
  /** Authoritative: derived from the window itself. */
  durationMinutes: number;
  /** As written by VECO, in minutes, or null if absent. Kept for audit. */
  statedDurationMinutes: number | null;
  durationMismatch: boolean;
}

const TIME = String.raw`(\d{1,2}):(\d{2})\s*([AaPp])\.?\s*[Mm]\.?`;
const MONTH_RE = MONTHS.join("|");
const EXPLICIT_RE = new RegExp(
  `${TIME}\\s+of\\s+(${MONTH_RE})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?\\s+to\\s+${TIME}\\s+of\\s+(${MONTH_RE})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?`,
  "i",
);
const SAME_DAY_RE = new RegExp(`${TIME}\\s+(?:to|-)\\s+${TIME}`, "i");
const DURATION_RE = /\(\s*(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)\.?\s*\)?/i;

function to24h(h: string, ap: string): number {
  const hour = Number(h) % 12;
  return /p/i.test(ap) ? hour + 12 : hour;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function parseTimeWindow(text: string, header: DayHeader | null): TimeWindow | null {
  const t = normalizeText(text);

  let startMs: number;
  let endMs: number;

  const ex = t.match(EXPLICIT_RE);
  if (ex) {
    const [, h1, m1, ap1, mon1, d1, y1, h2, m2, ap2, mon2, d2, y2] = ex;
    const fallbackYear = header?.start.year ?? new Date().getUTCFullYear();
    const sy = y1 ? Number(y1) : fallbackYear;
    const sm = monthIndex(mon1!);
    const em = monthIndex(mon2!);
    let ey = y2 ? Number(y2) : sy;
    if (!y2 && em < sm) ey = sy + 1;
    startMs = fromManila(sy, sm, Number(d1), to24h(h1!, ap1!), Number(m1));
    endMs = fromManila(ey, em, Number(d2), to24h(h2!, ap2!), Number(m2));
  } else {
    const sd = t.match(SAME_DAY_RE);
    if (!sd || !header) return null;
    const [, h1, m1, ap1, h2, m2, ap2] = sd;
    const { year, month, day } = header.start;
    startMs = fromManila(year, month, day, to24h(h1!, ap1!), Number(m1));
    endMs = fromManila(year, month, day, to24h(h2!, ap2!), Number(m2));
    if (endMs <= startMs) endMs += DAY_MS; // crosses midnight
  }

  const durationMinutes = Math.round((endMs - startMs) / MINUTE_MS);
  const dm = t.match(DURATION_RE);
  const statedDurationMinutes = dm ? Math.round(Number(dm[1]) * 60) : null;
  const durationMismatch = statedDurationMinutes !== null && Math.abs(statedDurationMinutes - durationMinutes) > 2;

  return { startMs, endMs, durationMinutes, statedDurationMinutes, durationMismatch };
}
