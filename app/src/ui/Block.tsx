import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { color, layout } from "../theme/tokens";

export interface BlockProps extends PropsWithChildren {
  fill?: string;
  /** Hard offset shadow (a second rectangle behind). Default on. Off inside lists that are dense. */
  shadow?: boolean;
  /** Dashed slate border — the STALE treatment (DG §4.5). */
  dashed?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  /** Animated transform for the content (stamp / slam / press / judder). */
  contentStyle?: AnimatedStyle<ViewStyle>;
  /** Animated style for the shadow (slam snaps it in). */
  shadowStyle?: AnimatedStyle<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * The neobrutalist unit: 2 dp ink border, optional 4 dp ink shadow drawn as a sibling view.
 * No elevation, no blur, no shadow props — the shadow is geometry (DG §5).
 */
export function Block({
  fill = color.ground, shadow = true, dashed = false, padding = layout.cardPadding,
  style, contentStyle, shadowStyle, children, accessibilityLabel,
}: BlockProps) {
  return (
    <View style={[styles.wrap, style]} accessibilityLabel={accessibilityLabel}>
      {shadow && <Animated.View pointerEvents="none" style={[styles.shadow, shadowStyle]} />}
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: fill, padding },
          dashed && styles.dashed,
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  shadow: {
    position: "absolute",
    left: layout.shadow, top: layout.shadow, right: -layout.shadow, bottom: -layout.shadow,
    backgroundColor: color.ink,
    borderRadius: layout.radius,
  },
  content: {
    borderWidth: layout.border,
    borderColor: color.ink,
    borderRadius: layout.radius,
  },
  dashed: { borderStyle: "dashed", borderColor: color.slate },
});
