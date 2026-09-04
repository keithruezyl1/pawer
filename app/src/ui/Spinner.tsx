/**
 * The loader. A 3×3 grid of cells swept by a gradient wavefront.
 *
 * `gradient-spin` itself is a DOM component — it renders divs with a CSS keyframe and injects a
 * <style> tag — so it cannot run here. What IS portable is its maths, and that is what this uses:
 * `gradientPresets` for the palettes, `sampleGradient` for the OKLab sampling, and
 * `cellWaveOrder` for each cell's place in the wave. Only the rendering layer is ours. Every
 * `document` access in that package sits inside a guarded useInsertionEffect, so importing the
 * helpers is safe even though rendering its component is not.
 *
 * This LOOPS, which the animation vocabulary otherwise forbids (D-34). A loader is the one place
 * a loop is the point: it exists only while the app is waiting, it animates opacity alone so it
 * stays on the compositor, and it therefore keeps moving even when the JS thread is busy — which
 * is exactly when a spinner earns its keep. Reduce-motion renders it static.
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { cellWaveOrder, gradientPresets, sampleGradient, type GradientPresetName, type SpinPattern } from "gradient-spin";
import { useReduceMotion } from "../theme/motion";

export interface SpinnerProps {
  /** Defaults are Keith's configuration from the design pass. */
  gradient?: GradientPresetName;
  pattern?: SpinPattern;
  rows?: number;
  cols?: number;
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;
  /** Full cycle, ms. */
  period?: number;
  /** Resting opacity, 0..1. */
  dim?: number;
  /** "path" colours by position in the wave; "row" colours by row. */
  colorBy?: "path" | "row";
  /** Multiplies cellSize and cellGap. The configured 5 px cell is deliberately tiny; scale it
   *  up rather than re-tuning the grid, so every loader in the app stays the same shape. */
  scale?: number;
}

function Cell({
  color, size, radius, delay, period, dim, reduce,
}: { color: string; size: number; radius: number; delay: number; period: number; dim: number; reduce: boolean }) {
  const o = useSharedValue(dim);

  useEffect(() => {
    if (reduce) { o.value = 1; return; }
    // Up quickly, down slowly — the wavefront reads as travelling rather than blinking.
    o.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: period * 0.28, easing: Easing.out(Easing.quad) }),
          withTiming(dim, { duration: period * 0.72, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [reduce, delay, period, dim]);

  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: color }, style]} />;
}

export function Spinner({
  gradient = "tonic",
  pattern = "diagonal",
  rows = 3,
  cols = 3,
  cellSize = 5,
  cellGap = 2,
  cellRadius = 1,
  period = 1200,
  dim = 0.2,
  colorBy = "path",
  scale = 1,
}: SpinnerProps) {
  const reduce = useReduceMotion();
  const stops = gradientPresets[gradient];
  const size = cellSize * scale;
  const gap = cellGap * scale;
  const radius = cellRadius * scale;

  return (
    <View style={[styles.grid, { gap }]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {Array.from({ length: cols }, (_, c) => {
            const { d, max } = cellWaveOrder(pattern, r, c, rows, cols);
            // t drives both the colour and the stagger, so a cell's hue matches its moment.
            const t = colorBy === "row" ? (rows > 1 ? r / (rows - 1) : 0) : max > 0 ? d / max : 0;
            return (
              <Cell
                key={c}
                color={sampleGradient(stops, t)}
                size={size}
                radius={radius}
                delay={Math.round(t * period)}
                period={period}
                dim={dim}
                reduce={reduce}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "column" },
  row: { flexDirection: "row" },
});
