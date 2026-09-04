/**
 * The surface layer: the grid ground, the hatch
 * in a card's corner, and the row helpers that keep an icon glued to its value.
 *
 * All of it is geometry — Rects and Lines — so nothing animates and nothing blurs (NFR-4).
 */
import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { color, layout, space, type } from "../theme/tokens";
import { T } from "./Text";

/**
 * The ground: a hairline grid, tinted with the accent so it reads as a warm hint rather than a
 * grey mesh. One SVG <Pattern>, so the whole screen is a single draw call.
 *
 * It replaces the checkerboard (D-43). A checker at this scale competed with the cards for
 * attention; a grid sits behind them and is barely there until you look for it.
 */
export function Grid() {
  const s = layout.gridSquare;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grd" width={s} height={s} patternUnits="userSpaceOnUse">
            {/* Two edges per tile is all a grid needs; drawing four would double every line. */}
            <Line x1={0} y1={0} x2={s} y2={0} stroke={color.gridLine} strokeWidth={1} />
            <Line x1={0} y1={0} x2={0} y2={s} stroke={color.gridLine} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#grd)" />
      </Svg>
    </View>
  );
}

/** Neobrutalist hatch, bottom-right of a card. Fixed 45° lines, no mask, no motion. */
export function Hatch({ width = 128, height = 82 }: { width?: number; height?: number }) {
  const step = 9;
  const lines: ReactNode[] = [];
  // Drawn from the bottom-right corner outward, each line shorter than the last, which is what
  // makes it dissolve toward the middle of the card without needing a gradient mask.
  for (let i = 0; i < Math.ceil((width + height) / step); i++) {
    const d = i * step;
    lines.push(
      <Line
        key={i}
        x1={width - d}
        y1={height}
        x2={width}
        y2={height - d}
        stroke={color.ink}
        strokeWidth={3}
        opacity={Math.max(0, 0.22 - i * 0.012)}
      />,
    );
  }
  return (
    <View pointerEvents="none" style={[styles.hatch, { width, height }]}>
      <Svg width={width} height={height}>{lines}</Svg>
    </View>
  );
}

/** An icon and its value, on one baseline. Times and places never travel alone. */
export function IconRow({
  icon,
  children,
  v = "body",
  muted,
  gap = 7,
  style,
  align = "center",
}: PropsWithChildren<{
  icon: ReactNode;
  v?: keyof typeof type;
  muted?: boolean;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  align?: "center" | "flex-start";
}>) {
  return (
    <View style={[{ flexDirection: "row", alignItems: align, gap }, style]}>
      {icon}
      <T v={v} muted={muted} style={styles.flex as StyleProp<TextStyle>}>
        {children}
      </T>
    </View>
  );
}

/** A section heading with its mark, used down the settings list. */
export function SectionLabel({ icon, children, style }: PropsWithChildren<{ icon: ReactNode; style?: StyleProp<ViewStyle> }>) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: space.xs + 3 }, style]}>
      {icon}
      <T v="label">{children}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  hatch: { position: "absolute", right: 0, bottom: 0 },
  flex: { flex: 1 },
});
