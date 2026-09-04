/**
 * The surface layer: the checkerboard ground, the fade that ends every scrolling list, the hatch
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
 * Checkerboard ground. An SVG <Pattern> tiles two squares of ink at 4.5%, so the whole screen
 * costs one draw call rather than hundreds of Views.
 */
export function Checker() {
  const s = layout.checkerSquare;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="chk" width={s * 2} height={s * 2} patternUnits="userSpaceOnUse">
            <Rect x={0} y={0} width={s} height={s} fill={color.checker} />
            <Rect x={s} y={s} width={s} height={s} fill={color.checker} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#chk)" />
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
