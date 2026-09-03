import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatDateShort, formatDuration, formatWindow, type Outage } from "@pawer/shared";
import { findBarangay, findLgu } from "@pawer/registry";
import { color, layout, space } from "../theme/tokens";
import { useSlam } from "../theme/motion";
import { Block } from "./Block";
import { T } from "./Text";

export interface OutageCardProps {
  outage: Outage;
  nowMs: number;
  onPress: () => void;
  /** All-areas view: the screen spans the franchise, so every name carries its LGU (DG §6.4). */
  alwaysLgu?: boolean;
  /** Quiet marker for barangays the user follows (All-areas only). */
  following?: boolean;
  /** Play `slam` on mount (a new card entering the list). */
  enter?: boolean;
}

export function barangayLabel(slug: string, alwaysLgu = false): string {
  const b = findBarangay(slug);
  if (!b) return slug;
  return alwaysLgu || b.ambiguous_across_lgus ? `${b.display}, ${findLgu(b.lgu)?.display ?? b.lgu}` : b.display;
}

export function OutageCard({ outage: o, nowMs, onPress, alwaysLgu, following, enter }: OutageCardProps) {
  const slam = useSlam();
  useEffect(() => { if (enter) slam.run(); }, []);

  const start = Date.parse(o.start);
  const end = Date.parse(o.end);
  const unreadable = o.parse_status === "failed";
  const incomplete = o.parse_status === "partial";
  const fill = unreadable || incomplete ? color.noticeFill : color.ground;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Block fill={fill} padding={space.lg} contentStyle={slam.style} shadowStyle={slam.shadowStyle} style={styles.card}>
        <View style={styles.row}>
          <T v="headline">{unreadable ? "Advisory" : formatDateShort(start, nowMs)}</T>
          {following && <T v="caption" muted>Following</T>}
        </View>
        {unreadable ? (
          <T v="body" muted>Couldn't read this advisory fully — tap to view it on Visayan Electric</T>
        ) : (
          <T v="body">{formatWindow(start, end)} · {formatDuration(o.duration_minutes)}</T>
        )}
        {incomplete && <T v="caption" muted>Some area names couldn't be matched — check the original</T>}
        <View style={styles.chips}>
          {o.barangays.map((slug) => (
            <View key={slug} style={styles.chip}>
              <T v="label">{barangayLabel(slug, alwaysLgu)}</T>
            </View>
          ))}
        </View>
      </Block>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: layout.shadow },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  chip: {
    borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius,
    paddingHorizontal: space.sm, paddingVertical: 2, backgroundColor: color.ground,
  },
});
