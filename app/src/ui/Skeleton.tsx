/**
 * Loading placeholders. Deliberately STATIC — DG §11 forbids skeleton shimmer by name, and a
 * pulse is a loop, which spends battery to say nothing (NFR-4). The blocks keep the real
 * layout's geometry so nothing jumps when the content lands.
 */
import { StyleSheet, View, type DimensionValue } from "react-native";
import { color, layout, space } from "../theme/tokens";
import { Block } from "./Block";
import { T } from "./Text";
import { Spinner } from "./Spinner";

export function Bar({ width, height = 14 }: { width: DimensionValue; height?: number }) {
  return <View style={[styles.bar, { width, height }]} />;
}

/** The hero's shape, before there is a status to show. */
export function HeroSkeleton() {
  return (
    <Block fill={color.ground} style={styles.hero}>
      <View style={styles.stack}>
        <Bar width="38%" height={13} />
        <Bar width="88%" height={34} />
        <Bar width="64%" height={34} />
        <Bar width="74%" height={18} />
        <Bar width="42%" height={14} />
      </View>
    </Block>
  );
}

export function CardSkeleton({ widths = ["46%", "70%", "54%"] as DimensionValue[] }) {
  return (
    <Block fill={color.ground} padding={space.lg} style={styles.card}>
      <View style={styles.stack}>
        <Bar width={widths[0]!} height={18} />
        <Bar width={widths[1]!} height={15} />
        <Bar width={widths[2]!} height={22} />
      </View>
    </Block>
  );
}

/** Says it is working rather than stuck. The grid is the loader everywhere in the app. */
export function FetchingNote() {
  return (
    <View style={styles.fetching}>
      <Spinner scale={2} />
      <T v="caption" muted>Fetching this week's advisories</T>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: color.surface2, borderRadius: 3 },
  stack: { gap: space.md - 2 },
  hero: { marginHorizontal: layout.screenMargin, marginBottom: layout.shadow, minHeight: 210 },
  card: { marginBottom: layout.shadow },
  fetching: { flexDirection: "row", alignItems: "center", gap: space.md },
});
