import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatDateShort, formatDuration, formatWindow, type Outage } from "@pawer/shared";
import { findBarangay, findLgu } from "@pawer/registry";
import { color, layout, space } from "../theme/tokens";
import { useSlam } from "../theme/motion";
import { Block } from "./Block";
import { T } from "./Text";
import { Clock, Pin, Warn } from "./Icon";
import { Hatch, IconRow } from "./Surface";

/**
 * Decorative fills, rotated by position so a list of cards is not one flat colour. These are
 * TINTS (a status hue at 32% over ground), never the saturated four — those mean status, and a
 * pastel card must never look like it is claiming one (DG §4).
 */
const TINTS = [color.tint.upcoming, color.tint.clear, color.tint.ended] as const;

export interface OutageCardProps {
  outage: Outage;
  nowMs: number;
  onPress: () => void;
  /** All-areas view: the screen spans the franchise, so every name carries its LGU (DG §6.4). */
  alwaysLgu?: boolean;
  /** Quiet marker for barangays the user follows — a filled pin, not a word. */
  following?: boolean;
  /** Play `slam` on mount (a new card entering the list). */
  enter?: boolean;
  /** Position in the list, which picks the tint. */
  index?: number;
}

export function barangayLabel(slug: string, alwaysLgu = false): string {
  const b = findBarangay(slug);
  if (!b) return slug;
  return alwaysLgu || b.ambiguous_across_lgus ? `${b.display}, ${findLgu(b.lgu)?.display ?? b.lgu}` : b.display;
}

/** A barangay chip always carries its pin — one per chip, so it survives wrapping. */
function PinChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Pin size={12} />
      <T v="label">{label}</T>
    </View>
  );
}

export function OutageCard({ outage: o, nowMs, onPress, alwaysLgu, following, enter, index = 0 }: OutageCardProps) {
  const slam = useSlam();
  useEffect(() => { if (enter) slam.run(); }, []);

  const start = Date.parse(o.start);
  const end = Date.parse(o.end);
  const unreadable = o.parse_status === "failed";
  const incomplete = o.parse_status === "partial";
  // A parse problem is information, not decoration: it keeps the notice fill and loses the hatch.
  const fill = unreadable || incomplete ? color.noticeFill : TINTS[index % TINTS.length]!;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Block
        fill={fill}
        padding={space.lg}
        contentStyle={slam.style}
        shadowStyle={slam.shadowStyle}
        style={styles.card}
        clip
      >
        {!unreadable && !incomplete && <Hatch />}
        <View style={styles.row}>
          <T v="headline">{unreadable ? "Advisory" : formatDateShort(start, nowMs)}</T>
          {following && <Pin size={13} filled />}
        </View>
        {unreadable ? (
          <T v="body" muted>Couldn't read this one. Tap to view the original.</T>
        ) : (
          <IconRow icon={<Clock size={15} />}>
            {formatWindow(start, end)} · {formatDuration(o.duration_minutes)}
          </IconRow>
        )}
        {incomplete && (
          <IconRow icon={<Warn size={13} tone={color.slate} />} v="caption" muted style={styles.note}>
            Some areas couldn't be matched
          </IconRow>
        )}
        <View style={styles.chips}>
          {o.barangays.map((slug) => (
            <PinChip key={slug} label={barangayLabel(slug, alwaysLgu)} />
          ))}
        </View>
      </Block>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: layout.shadow },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.xs + 2 },
  note: { marginTop: space.xs + 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius,
    paddingLeft: space.sm - 1, paddingRight: space.sm + 1, paddingVertical: 3,
    backgroundColor: color.ground,
  },
});
