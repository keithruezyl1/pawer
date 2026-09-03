/**
 * Lines → day groups → entries (ARCH §5.2). Day headers and the "Time:" label are the only
 * structural anchors. Every label line is trimmed before matching so the leading-space defect
 * (" Time:") cannot break segmentation.
 */
import { normalizeText } from "./normalize";

export interface DayRef { year: number; month: number; day: number }
export interface DayHeader { start: DayRef; end: DayRef }

export interface Entry {
  time: string;
  purpose: string;
  areas: string;
}

export interface DayGroup {
  header: DayHeader | null;
  headerText: string;
  entries: Entry[];
}

export const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

export function monthIndex(name: string): number {
  const i = MONTHS.indexOf(name.toLowerCase() as (typeof MONTHS)[number]);
  return i === -1 ? -1 : i + 1;
}

const MONTH_RE = MONTHS.join("|");
// "August 30, 2026 (Sunday)" · "August 30-31, 2026 (Sunday-Monday)" · "August 31-September 1, 2026 (…)"
const DAY_HEADER_RE = new RegExp(
  `^(${MONTH_RE})\\s+(\\d{1,2})(?:\\s*-\\s*(?:(${MONTH_RE})\\s+)?(\\d{1,2}))?,\\s*(\\d{4})\\s*\\([^)]*\\)\\.?$`,
  "i",
);

export function parseDayHeader(line: string): DayHeader | null {
  const m = normalizeText(line).match(DAY_HEADER_RE);
  if (!m) return null;
  const [, m1, d1, m2, d2, y] = m;
  const year = Number(y);
  const startMonth = monthIndex(m1!);
  const start: DayRef = { year, month: startMonth, day: Number(d1) };
  if (d2 === undefined) return { start, end: { ...start } };
  const endMonth = m2 ? monthIndex(m2) : startMonth;
  const endYear = endMonth < startMonth ? year + 1 : year;
  return { start, end: { year: endYear, month: endMonth, day: Number(d2) } };
}

type Field = "time" | "purpose" | "areas" | "map";

function labelOf(norm: string): Field | null {
  const l = norm.replace(/\s*:\s*$/, "").toLowerCase();
  if (l === "time") return "time";
  if (l === "purpose") return "purpose";
  if (l === "areas affected" || l === "area affected" || l === "affected areas") return "areas";
  if (l === "map") return "map";
  return null;
}

export function segment(lines: readonly string[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let group: DayGroup | null = null;
  let entry: Entry | null = null;
  let field: Field | null = null;

  for (const raw of lines) {
    const norm = normalizeText(raw);
    if (!norm) continue;

    const header = parseDayHeader(norm);
    if (header) {
      group = { header, headerText: norm, entries: [] };
      groups.push(group);
      entry = null;
      field = null;
      continue;
    }

    const label = labelOf(norm);
    if (label) {
      if (label === "time") {
        if (!group) {
          group = { header: null, headerText: "", entries: [] };
          groups.push(group);
        }
        entry = { time: "", purpose: "", areas: "" };
        group.entries.push(entry);
      }
      field = label;
      continue;
    }

    if (!entry || !field || field === "map") continue;
    entry[field] = entry[field] ? `${entry[field]} ${norm}` : norm;
  }

  return groups;
}
