import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { color, layout, space } from "../theme/tokens";
import { usePress } from "../theme/motion";
import { T } from "./Text";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary = accent fill (the one place accent lives on a screen). secondary = ground. ghost = text only. */
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  /** Drawn glyph before the label. */
  icon?: ReactNode;
}

/**
 * Press is physical: the block translates (4,4) onto its shadow and back (DG §5, §11 `press`).
 * That is the only feedback — no ripple, no colour change.
 */
export function Button({ label, onPress, variant = "secondary", disabled, style, accessibilityHint, icon }: ButtonProps) {
  const press = usePress();
  const ghost = variant === "ghost";
  const fill = variant === "primary" ? color.accent : color.ground;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.down}
      onPressOut={press.up}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.hit, style, disabled && styles.disabled]}
    >
      {!ghost && <View pointerEvents="none" style={styles.shadow} />}
      <Animated.View style={[styles.face, ghost ? styles.ghostFace : { backgroundColor: fill }, press.style]}>
        {icon}
        {/* Accent carries labels at headline or larger only (DG §4.4). */}
        <T v={ghost ? "label" : "headline"} style={styles.label}>{label}</T>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: layout.touchTarget, position: "relative" },
  disabled: { opacity: 0.45 },
  shadow: {
    position: "absolute",
    left: layout.shadow, top: layout.shadow, right: -layout.shadow, bottom: -layout.shadow,
    backgroundColor: color.ink, borderRadius: layout.radius,
  },
  face: {
    minHeight: layout.touchTarget,
    borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius,
    paddingHorizontal: space.xl, paddingVertical: space.md,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: space.sm + 1,
  },
  ghostFace: { borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: space.md },
  label: { textAlign: "center" },
});
