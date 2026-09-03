/**
 * Manila time without a timezone database.
 *
 * The Philippines has observed no daylight saving since 1978, so a fixed +08:00 offset is
 * exact (ARCH §8.3). All arithmetic is on epoch milliseconds; only display and "today"
 * boundaries need the offset. No Intl, no tz library — Hermes-safe and dependency-free.
 */

export const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export interface ManilaParts {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function manilaParts(epochMs: number): ManilaParts {
  const d = new Date(epochMs + PH_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(),
  };
}

export function fromManila(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  return Date.UTC(year, month - 1, day, hour, minute, second) - PH_OFFSET_MS;
}

export function manilaMidnight(epochMs: number): number {
  const p = manilaParts(epochMs);
  return fromManila(p.year, p.month, p.day);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function manilaDateKey(epochMs: number): string {
  const p = manilaParts(epochMs);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** ISO 8601 with the explicit +08:00 offset, as stored in advisories.json. */
export function toIsoManila(epochMs: number): string {
  const p = manilaParts(epochMs);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}+08:00`;
}

export function formatTime12h(epochMs: number): string {
  const p = manilaParts(epochMs);
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h12}:${pad2(p.minute)} ${p.hour < 12 ? "AM" : "PM"}`;
}

export function formatWindow(startMs: number, endMs: number): string {
  if (manilaDateKey(startMs) === manilaDateKey(endMs)) {
    return `${formatTime12h(startMs)} – ${formatTime12h(endMs)}`;
  }
  const ws = WEEKDAYS[manilaParts(startMs).weekday];
  const we = WEEKDAYS[manilaParts(endMs).weekday];
  return `${formatTime12h(startMs)} ${ws} – ${formatTime12h(endMs)} ${we}`;
}

/** `8h`, `6h 10m`, `45m` — never decimal hours (DG §2.2). */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDateShort(epochMs: number, nowMs: number): string {
  const key = manilaDateKey(epochMs);
  if (key === manilaDateKey(nowMs)) return "Today";
  if (key === manilaDateKey(nowMs + DAY_MS)) return "Tomorrow";
  const p = manilaParts(epochMs);
  return `${WEEKDAYS[p.weekday]}, ${MONTHS[p.month - 1]} ${p.day}`;
}
