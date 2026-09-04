/**
 * Drawn glyphs (DG §11). Neither Getai Grotesk nor Aspekta carries ›, ✓ or ✗ — as literal text
 * they render as tofu — and the app has no SVG dependency, so these are built the same way the
 * chip's ✕ is: bordered Views under a rotation. No library, no font dependency, scales with size.
 */
import { View } from "react-native";
import { color, layout } from "../theme/tokens";

export interface GlyphProps {
  /** Bounding size in dp. Stroke scales with it. */
  size?: number;
  tone?: string;
}

const ROTATION = { right: "45deg", down: "135deg", left: "225deg", up: "315deg" } as const;

/** Chevron. Right by default; `left` is the back affordance, `down`/`up` the group toggles. */
export function Chevron({ size = 12, tone = color.ink, direction = "right" }: GlyphProps & {
  direction?: keyof typeof ROTATION;
}) {
  const s = Math.round(size * 0.7);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: s,
          height: s,
          borderTopWidth: layout.border,
          borderRightWidth: layout.border,
          borderColor: tone,
          transform: [{ rotate: ROTATION[direction] }],
        }}
      />
    </View>
  );
}

/** Tick — "PAWER can tell you this". */
export function Check({ size = 18, tone = color.ink }: GlyphProps) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.4,
          height: size * 0.72,
          borderRightWidth: 2.5,
          borderBottomWidth: 2.5,
          borderColor: tone,
          transform: [{ rotate: "45deg" }, { translateY: -1 }],
        }}
      />
    </View>
  );
}

/** Cross — "PAWER cannot tell you this". */
export function Cross({ size = 18, tone = color.ink }: GlyphProps) {
  const bar = { position: "absolute" as const, width: size * 0.8, height: 2.5, backgroundColor: tone };
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}
