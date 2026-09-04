import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  formatDateShort, formatDuration, formatTime12h, formatWindow,
  type Outage, type StatusResult, type WidgetStateName,
} from "@pawer/shared";
import { findBarangay, displayName } from "@pawer/registry";
import { color, layout, space } from "../theme/tokens";
import { useStamp } from "../theme/motion";
import { useSounds } from "../theme/sound";
import { Block } from "./Block";
import { T } from "./Text";
import { Pin, Warn } from "./Icon";
import { IconRow } from "./Surface";

const FILL: Record<WidgetStateName, string> = {
  NONE_TODAY: color.status.clear,
  UPCOMING_TODAY: color.status.upcoming,
  ONGOING: color.status.ongoing,
  ENDED_TODAY: color.status.ended,
};

function areaLabel(o: Outage | undefined, selected: readonly string[]): string {
  if (!o) return "";
  const mine = o.barangays.filter((b) => selected.includes(b));
  if (mine.length === 0) return "";
  if (mine.length > 1) return `${mine.length} of your areas`;
  const b = findBarangay(mine[0]!);
  return b ? `Part of ${displayName(b)}` : "";
}

export interface StatusFieldProps {
  status: StatusResult;
  selected: readonly string[];
  nowMs: number;
}

/**
 * How long ago the feed was last checked. Lives here beside the state machine but renders in the
 * dashboard's meta row, which is the only place the canvas puts it — the hero carries the schedule,
 * not the plumbing.
 */
export function freshnessLabel(nowMs: number, fetchedAtMs: number): string {
  const m = Math.round((nowMs - fetchedAtMs) / 60000);
  if (m < 1) return "Checked just now";
  if (m < 60) return `Checked ${m} min ago`;
  return `Last checked ${formatDateShort(fetchedAtMs, nowMs)}, ${formatTime12h(fetchedAtMs)}`;
}

/**
 * The hero. Mirrors the widget's state machine exactly (PRD §7.1) — same resolveStatus, same
 * copy discipline: the schedule, never the grid (DG §2.1). `stamp`s on every state change.
 * The countdown is plain text updated by the parent's clock; `count` is deliberately no animation.
 */
export function StatusField({ status, selected, nowMs }: StatusFieldProps) {
  const stamp = useStamp();
  const sounds = useSounds();
  const prev = useRef<WidgetStateName | null>(null);
  useEffect(() => {
    if (prev.current !== null && prev.current !== status.state) { stamp.run(); sounds.statusChanged(); }
    prev.current = status.state;
  }, [status.state]);

  const o = status.activeOutage ?? status.nextOutage;
  const start = o ? Date.parse(o.start) : 0;
  const end = o ? Date.parse(o.end) : 0;
  const minsTo = (t: number) => Math.max(0, Math.ceil((t - nowMs) / 60000));

  let tag = "TODAY";
  let display = "";
  let detail = "";
  let sub = "";

  switch (status.state) {
    case "NONE_TODAY":
      display = "No scheduled outage today";
      if (status.nextOutage) {
        tag = "TODAY";
        detail = `Next: ${formatDateShort(start, nowMs)} · ${formatWindow(start, end)}`;
        sub = areaLabel(status.nextOutage, selected);
      } else {
        detail = "Nothing scheduled for your areas";
      }
      break;
    case "UPCOMING_TODAY":
      display = `Outage in ${formatDuration(minsTo(start))}`;
      detail = `${formatWindow(start, end)} · ${formatDuration(o!.duration_minutes)}`;
      sub = areaLabel(o, selected);
      break;
    case "ONGOING":
      tag = "NOW";
      display = "Scheduled outage in progress";
      detail = `Expected restoration ${formatTime12h(end)} · ${formatDuration(minsTo(end))} remaining`;
      sub = areaLabel(o, selected);
      break;
    case "ENDED_TODAY":
      display = "Power should be restored by now";
      detail = `Scheduled outage ended ${formatTime12h(end)}`;
      sub = areaLabel(o, selected);
      break;
  }
  if (status.todayCount > 1 && status.todayIndex) tag = `${tag} ${status.todayIndex}/${status.todayCount}`;

  const a11y = `${tag}. ${display}. ${detail}. ${sub}`.replace(/\.\s*\./g, ".");

  return (
    <Block
      fill={FILL[status.state]}
      dashed={status.isStale}
      contentStyle={stamp.style}
      style={[styles.hero, status.isStale && styles.stale]}
      accessibilityLabel={a11y}
    >
      <View style={styles.inner}>
        <T v="label" style={styles.tag}>{tag}</T>
        <T v="display" style={styles.display}>{display}</T>
        {detail ? <T v="headline">{detail}</T> : null}
        {/* A geographical value never travels without its pin. The TIME here deliberately has no
            clock: inside a status card the time is the headline, not a field (DG §3). */}
        {sub ? (
          <IconRow icon={<Pin size={14} />} v="label" style={styles.sub}>{sub}</IconRow>
        ) : null}
        {status.isStale ? (
          <IconRow icon={<Warn size={13} />} v="caption" style={styles.staleNote}>Data may be outdated</IconRow>
        ) : null}
      </View>
    </Block>
  );
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: layout.screenMargin, marginBottom: layout.shadow },
  stale: { opacity: 0.85 },
  inner: { minHeight: 210, justifyContent: "flex-start", gap: space.sm },
  tag: { letterSpacing: 0 },
  display: { marginTop: space.xs },
  sub: { marginTop: space.xs },
  staleNote: { marginTop: space.sm },
});
