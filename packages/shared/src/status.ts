/**
 * The widget/dashboard state machine — PRD §7.1, FR-23 (precedence), FR-24 (cross-midnight),
 * FR-11 (stale). Pure: outages + selected barangays + clock in, state out. The app's hero card
 * and the widget's precomputed blob both derive from this, so they cannot disagree.
 */
import { DAY_MS, manilaMidnight } from "./time";
import type { Outage, WidgetStateName } from "./types";

export const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

export interface StatusResult {
  state: WidgetStateName;
  /** The outage the state is about (today's ongoing / upcoming / last-ended). */
  activeOutage?: Outage;
  /** In NONE_TODAY, the soonest future outage, if any. */
  nextOutage?: Outage;
  isStale: boolean;
  /** Number of relevant outages intersecting today. */
  todayCount: number;
  /** 1-based position of activeOutage among today's outages by start time, for "TODAY 1/2". */
  todayIndex?: number;
}

const startMs = (o: Outage) => Date.parse(o.start);
const endMs = (o: Outage) => Date.parse(o.end);
const byStart = (a: Outage, b: Outage) => startMs(a) - startMs(b);

export function resolveStatus(
  outages: readonly Outage[],
  barangaySlugs: readonly string[],
  nowMs: number,
  fetchedAtMs: number,
): StatusResult {
  const selected = new Set(barangaySlugs);
  const isStale = nowMs - fetchedAtMs > STALE_AFTER_MS;

  // Failed entries carry no trustworthy window; they are shown, never used for state (§5.5).
  const relevant = outages
    .filter((o) => o.parse_status !== "failed" && o.barangays.some((b) => selected.has(b)))
    .sort(byStart);

  const dayStart = manilaMidnight(nowMs);
  const dayEnd = dayStart + DAY_MS;
  // "Today" = window intersects today's Manila calendar day. A 22:00→06:00 outage is today on both days.
  const today = relevant.filter((o) => startMs(o) < dayEnd && endMs(o) > dayStart);
  const indexOf = (o: Outage) => today.indexOf(o) + 1;

  const ongoing = today.find((o) => startMs(o) <= nowMs && nowMs < endMs(o));
  if (ongoing) {
    return { state: "ONGOING", activeOutage: ongoing, isStale, todayCount: today.length, todayIndex: indexOf(ongoing) };
  }

  const upcoming = today.find((o) => startMs(o) > nowMs);
  if (upcoming) {
    return { state: "UPCOMING_TODAY", activeOutage: upcoming, isStale, todayCount: today.length, todayIndex: indexOf(upcoming) };
  }

  if (today.length > 0) {
    const lastEnded = [...today].sort((a, b) => endMs(b) - endMs(a))[0]!;
    return { state: "ENDED_TODAY", activeOutage: lastEnded, isStale, todayCount: today.length, todayIndex: indexOf(lastEnded) };
  }

  const next = relevant.find((o) => startMs(o) > nowMs);
  return next
    ? { state: "NONE_TODAY", nextOutage: next, isStale, todayCount: 0 }
    : { state: "NONE_TODAY", isStale, todayCount: 0 };
}
