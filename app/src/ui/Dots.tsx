/**
 * Onboarding pagination. The current page is a wider oblong rather than a circle, so position
 * reads without counting. Width and fill are the animated properties, so moving between screens
 * morphs one dot open while the previous closes — the row's total width never changes, which is
 * why nothing else on the screen shifts.
 *
 * 220 ms ease-out. Transform-only is the usual rule, but width here is a 15 dp element on a
 * screen that is otherwise still, and the alternative (a sliding pill) needs a fixed pitch that
 * fights the gap. Honours reduce-motion like everything else (DG §11).
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { color, layout, space } from "../theme/tokens";
import { useReduceMotion } from "../theme/motion";

const DOT = 9;
const OBLONG = 24;
const MS = 220;

function Dot({ on, reduce }: { on: boolean; reduce: boolean }) {
  const w = useSharedValue(on ? OBLONG : DOT);
  const filled = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    const opts = { duration: reduce ? 0 : MS, easing: Easing.out(Easing.quad) };
    w.value = withTiming(on ? OBLONG : DOT, opts);
    filled.value = withTiming(on ? 1 : 0, opts);
  }, [on, reduce]);

  const style = useAnimatedStyle(() => ({
    width: w.value,
    backgroundColor: filled.value > 0.5 ? color.ink : color.ground,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function Dots({ active, total = 5 }: { active: number; total?: number }) {
  const reduce = useReduceMotion();
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={`Step ${active} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} on={i + 1 === active} reduce={reduce} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  dot: {
    height: DOT,
    borderRadius: 999,
    borderWidth: layout.border,
    borderColor: color.ink,
  },
});
