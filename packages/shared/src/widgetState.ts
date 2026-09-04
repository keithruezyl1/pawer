/**
 * The precomputed blob the widget reads (ARCH §9.2). The Kotlin side does only date arithmetic:
 * a Chronometer base, a label, two lines of text, and the exact instants at which to redraw.
 * Same StatusResult as the dashboard hero, so the two can never disagree.
 */
import { DAY_MS, formatDateShort, formatTime12h, formatWindow, manilaMidnight } from "./time";
import type { StatusResult } from "./status";
import type { WidgetState } from "./types";

export type AreaLabelFn = (selectedAffected: string[]) => string;

export function deriveWidgetState(
  status: StatusResult,
  selected: readonly string[],
  nowMs: number,
  fetchedAtMs: number,
  areaLabel: AreaLabelFn,
): WidgetState {
  const o = status.activeOutage ?? status.nextOutage;
  const start = o ? Date.parse(o.start) : null;
  const end = o ? Date.parse(o.end) : null;
  const affected = o ? o.barangays.filter((b) => selected.includes(b)) : [];

  let label = "TODAY";
  let primary: number | null = null;
  let secondary: string;

  switch (status.state) {
    case "NONE_TODAY":
      if (o && start !== null && end !== null) {
        label = "NEXT";
        // Date short gives "Thu, Sep 3" — the widget has ~4 lines, keep the weekday only.
        secondary = `${shortDay(start, nowMs)} · ${formatWindow(start, end)}`;
      } else {
        secondary = "No scheduled outage";
      }
      break;
    case "UPCOMING_TODAY":
      primary = start;
      secondary = `until ${formatTime12h(start!)}`;
      break;
    case "ONGOING":
      label = "NOW";
      primary = end;
      secondary = `until ${formatTime12h(end!)}`;
      break;
    case "ENDED_TODAY":
      secondary = "Should be back by now";
      break;
  }
  if (status.todayCount > 1 && status.todayIndex) label = `${label} ${status.todayIndex}/${status.todayCount}`;

  // Wakeups: the active outage's start and end (if still ahead), plus the next local midnight (FR-26).
  const boundaries = new Set<number>();
  if (status.activeOutage) {
    const s = Date.parse(status.activeOutage.start);
    const e = Date.parse(status.activeOutage.end);
    if (s > nowMs) boundaries.add(s);
    if (e > nowMs) boundaries.add(e);
  }
  boundaries.add(manilaMidnight(nowMs) + DAY_MS);

  return {
    state: status.state,
    label,
    primary_until_ms: primary,
    secondary,
    area_label: affected.length ? areaLabel(affected) : "",
    next_start_ms: status.state === "NONE_TODAY" && start !== null ? start : null,
    fetched_at_ms: fetchedAtMs,
    boundaries_ms: [...boundaries].sort((a, b) => a - b),
  };
}

function shortDay(ms: number, nowMs: number): string {
  const d = formatDateShort(ms, nowMs);
  return d === "Today" || d === "Tomorrow" ? d : d.slice(0, 3); // "Fri"
}
