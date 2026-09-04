/**
 * Decorative shapes for onboarding. Flat fills with a 2 dp ink outline, like everything else.
 *
 * They MOVE, which is the one exception to "nothing on a loop" (DG §11): onboarding is seen once,
 * for about a minute, and these are transform-only on the UI thread, so the cost is a rounding
 * error. Reduce-motion stops them dead. Nothing else in the app loops.
 */
import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path, Polygon, Rect } from "react-native-svg";
import { color, layout } from "../theme/tokens";
import { useReduceMotion } from "../theme/motion";

export function Burst({ size = 80, fill = color.status.ended as string, spikes = 12 }: { size?: number; fill?: string; spikes?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? size / 2 - 1 : size / 4.2;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${size / 2 + r * Math.cos(a)},${size / 2 + r * Math.sin(a)}`);
  }
  return (
    <Svg width={size} height={size}>
      <Polygon points={pts.join(" ")} fill={fill} stroke={color.ink} strokeWidth={layout.border} strokeLinejoin="round" />
    </Svg>
  );
}

export function Sparkle({ size = 40, fill = color.status.upcoming as string }: { size?: number; fill?: string }) {
  const h = size / 2;
  const d =
    `M${h} 1 C${h} ${h * 0.65} ${h * 0.65} ${h} 1 ${h} ` +
    `C${h * 0.65} ${h} ${h} ${h * 1.35} ${h} ${size - 1} ` +
    `C${h} ${h * 1.35} ${h * 1.35} ${h} ${size - 1} ${h} ` +
    `C${h * 1.35} ${h} ${h} ${h * 0.65} ${h} 1 Z`;
  return (
    <Svg width={size} height={size}>
      <Path d={d} fill={fill} stroke={color.ink} strokeWidth={layout.border} strokeLinejoin="round" />
    </Svg>
  );
}

export function Squiggle({ width = 76, height = 28, tone = color.ink as string }: { width?: number; height?: number; tone?: string }) {
  return (
    <Svg width={width} height={height} fill="none">
      <Path
        d={`M2 ${height - 4} Q ${width * 0.25} 2 ${width * 0.5} ${height / 2} T ${width - 2} 4`}
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function Pill({ width = 96, height = 34, fill = color.accent as string }: { width?: number; height?: number; fill?: string }) {
  return (
    <Svg width={width} height={height}>
      <Rect x={1.5} y={1.5} width={width - 3} height={height - 3} rx={height / 2} fill={fill} stroke={color.ink} strokeWidth={layout.border} />
    </Svg>
  );
}

export function Disc({ size = 28, fill = color.status.clear as string }: { size?: number; fill?: string }) {
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1.5} fill={fill} stroke={color.ink} strokeWidth={layout.border} />
    </Svg>
  );
}

type Motion = "drift" | "bob" | "turn";

const SPEC: Record<Motion, { ms: number; to: { y?: number; deg?: number } }> = {
  drift: { ms: 6000, to: { y: -14, deg: 7 } },
  bob: { ms: 5000, to: { y: 10, deg: -6 } },
  turn: { ms: 22000, to: { deg: 360 } },
};

/**
 * Places a shape absolutely and gives it one of three slow motions. `turn` runs one direction;
 * the other two ease back and forth.
 */
export function Floater({
  children,
  motion = "drift",
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  motion?: Motion;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  const t = useSharedValue(0);
  const spec = SPEC[motion];

  useEffect(() => {
    if (reduce) { t.value = 0; return; }
    const spin = motion === "turn";
    t.value = withRepeat(
      withTiming(1, { duration: spec.ms, easing: spin ? Easing.linear : Easing.inOut(Easing.quad) }),
      -1,
      !spin, // reverse for drift and bob; turn keeps going one way
    );
  }, [reduce, motion]);

  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateY: (spec.to.y ?? 0) * t.value },
      { rotate: `${(spec.to.deg ?? 0) * t.value}deg` },
    ],
  }));

  return (
    <View pointerEvents="none" style={[styles.floater, style]}>
      <Animated.View style={anim}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  floater: { position: "absolute" },
});
