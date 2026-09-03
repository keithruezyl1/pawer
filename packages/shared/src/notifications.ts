/**
 * The three on-device alerts (PRD FR-29–34), derived from scratch on every refresh so the
 * pending set is always exactly what the current data implies — rescheduled or withdrawn
 * outages self-correct with no server-side cancellation (FR-31).
 *
 * Pure: outages + selection + toggles + clock in, a sorted, capped list out. The platform
 * scheduler (expo-notifications) consumes it; nothing here touches a device API.
 */
import { formatDuration, formatTime12h, formatWindow, manilaMidnight, DAY_MS } from "./time";
import type { Outage } from "./types";
import type { AreaLabelFn } from "./widgetState";

export type LocalKind = "eveningBefore" | "hourBefore" | "restoration";

export interface AlertPrefs {
  eveningBefore: boolean;
  hourBefore: boolean;
  restoration: boolean;
}

export interface LocalNotification {
  /** Deterministic: `${kind}:${outageId}` — a rebuild replaces, never duplicates. */
  key: string;
  kind: LocalKind;
  outageId: string;
  fireAtMs: number;
  title: string;
  body: string;
}

export const HORIZON_MS = 14 * DAY_MS; // FR-32
export const MAX_PENDING = 64; // iOS cap; Android has none but one rule is simpler
const EVENING_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

export function deriveLocalNotifications(
  outages: readonly Outage[],
  selected: readonly string[],
  prefs: AlertPrefs,
  nowMs: number,
  areaLabel: AreaLabelFn,
): LocalNotification[] {
  const sel = new Set(selected);
  const out: LocalNotification[] = [];

  for (const o of outages) {
    if (o.parse_status === "failed") continue;
    const affected = o.barangays.filter((b) => sel.has(b));
    if (affected.length === 0) continue;

    const start = Date.parse(o.start);
    const end = Date.parse(o.end);
    const who = areaLabel(affected);
    const window = formatWindow(start, end);

    if (prefs.eveningBefore) {
      const eve = manilaMidnight(start) - DAY_MS + EVENING_HOUR * HOUR_MS;
      push(out, o, "eveningBefore", eve, nowMs, `Outage tomorrow — ${who}`, `${window} · ${formatDuration(o.duration_minutes)}`);
    }
    if (prefs.hourBefore) {
      push(out, o, "hourBefore", start - HOUR_MS, nowMs, `Outage in about an hour — ${who}`, `Starts ${formatTime12h(start)}, expected until ${formatTime12h(end)}`);
    }
    if (prefs.restoration) {
      push(out, o, "restoration", end, nowMs, `Power should be restored — ${who}`, `Scheduled outage ended ${formatTime12h(end)}`);
    }
  }

  return out.sort((a, b) => a.fireAtMs - b.fireAtMs).slice(0, MAX_PENDING);
}

function push(out: LocalNotification[], o: Outage, kind: LocalKind, fireAtMs: number, nowMs: number, title: string, body: string) {
  if (fireAtMs <= nowMs) return; // already passed
  if (fireAtMs > nowMs + HORIZON_MS) return; // beyond the horizon
  out.push({ key: `${kind}:${o.id}`, kind, outageId: o.id, fireAtMs, title, body });
}
