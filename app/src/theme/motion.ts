/**
 * DESIGN-GUIDELINES §11 — the animation vocabulary as hooks. One hook per named animation,
 * one meaning each. Transform/opacity only, UI-thread worklets, linear or stepped timing,
 * nothing longer than 240 ms, and every hook collapses to a 0 ms cut when the system
 * reduce-motion setting is on. No screen defines its own animation; it composes these.
 *
 * Hard shadows are a sibling view offset (4,4) behind the content. "Shadow offset 0→4" is
 * therefore rendered by translating the CONTENT from (4,4) to (0,0) over the static shadow —
 * one animated view, no shadow props, no GPU cost.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { duration, layout } from "./tokens";

// ---------------------------------------------------------------------------------------------
// reduce-motion

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduce(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduce;
}

const LINEAR = { easing: Easing.linear };

/** Instant set: a "step" in a stepped sequence. */
const cut = (to: number) => withTiming(to, { duration: 0 });
/** Instant set after a hold. */
const stepAfter = (ms: number, to: number) => withDelay(ms, cut(to));

// ---------------------------------------------------------------------------------------------
// stamp — a status was resolved or updated

export function useStamp() {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const lift = useSharedValue(0); // content translate; 4 = sitting on its shadow (no visible shadow)
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: lift.value }, { translateY: lift.value }, { scale: scale.value }],
  }));
  const run = () => {
    if (reduce) return;
    scale.value = 1.08;
    lift.value = layout.shadow;
    scale.value = withTiming(1, { duration: duration.stamp, ...LINEAR });
    lift.value = withTiming(0, { duration: duration.stamp, ...LINEAR });
  };
  return { style, run };
}

// ---------------------------------------------------------------------------------------------
// slam — something was added (3 discrete steps: −16, −6, 0; shadow snaps in on the last)

export function useSlam() {
  const reduce = useReduceMotion();
  const y = useSharedValue(0);
  const shadowOpacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: shadowOpacity.value }));
  const run = () => {
    if (reduce) return;
    const step = duration.slam / 3;
    y.value = -16;
    shadowOpacity.value = 0;
    y.value = withSequence(stepAfter(step, -6), stepAfter(step, 0));
    shadowOpacity.value = stepAfter(step * 2, 1);
  };
  return { style, shadowStyle, run };
}

// ---------------------------------------------------------------------------------------------
// press — you pressed this (the block goes into the page)

export function usePress() {
  const reduce = useReduceMotion();
  const depth = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: depth.value }, { translateY: depth.value }],
  }));
  const down = () => { depth.value = reduce ? layout.shadow : withTiming(layout.shadow, { duration: duration.press, ...LINEAR }); };
  const up = () => { depth.value = reduce ? 0 : withTiming(0, { duration: duration.press, ...LINEAR }); };
  return { style, down, up };
}

// ---------------------------------------------------------------------------------------------
// tear — removed (0 → 8 → 16 → 24, opacity drops on the last step)

export function useTear() {
  const reduce = useReduceMotion();
  const x = useSharedValue(0);
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: opacity.value }));
  /** Resolves when the element has visually left; caller then removes it from the tree. */
  const run = () =>
    new Promise<void>((resolve) => {
      if (reduce) { opacity.value = 0; resolve(); return; }
      const step = duration.tear / 3;
      x.value = withSequence(stepAfter(step, 8), stepAfter(step, 16), stepAfter(step, 24));
      opacity.value = stepAfter(step * 3, 0);
      setTimeout(resolve, duration.tear + 16);
    });
  return { style, run };
}

// ---------------------------------------------------------------------------------------------
// tick — checking for data (card flip on the freshness caption)

export function useTick() {
  const reduce = useReduceMotion();
  const rx = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ perspective: 400 }, { rotateX: `${rx.value}deg` }] }));
  const run = () => {
    if (reduce) return;
    const half = duration.tick / 2;
    rx.value = withSequence(withTiming(-90, { duration: half, ...LINEAR }), withTiming(0, { duration: half, ...LINEAR }));
  };
  return { style, run };
}

// ---------------------------------------------------------------------------------------------
// bump — data changed (two frames: −6 then 0)

export function useBump() {
  const reduce = useReduceMotion();
  const y = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const run = () => {
    if (reduce) return;
    y.value = -6;
    y.value = stepAfter(duration.bump, 0);
  };
  return { style, run };
}

// ---------------------------------------------------------------------------------------------
// judder — that didn't work (±3 dp, three cycles)

export function useJudder() {
  const reduce = useReduceMotion();
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const run = () => {
    if (reduce) return;
    const half = duration.judder / 6;
    x.value = withSequence(
      withTiming(3, { duration: half, ...LINEAR }), withTiming(-3, { duration: half, ...LINEAR }),
      withTiming(3, { duration: half, ...LINEAR }), withTiming(-3, { duration: half, ...LINEAR }),
      withTiming(3, { duration: half, ...LINEAR }), withTiming(0, { duration: half, ...LINEAR }),
    );
  };
  return { style, run };
}

// ---------------------------------------------------------------------------------------------
// wipe — moving to the next step (ink block sweeps left→right; the next screen is already behind it)

export function useWipe(screenWidth: number) {
  const reduce = useReduceMotion();
  const x = useSharedValue(-screenWidth);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  /** Resolves at the midpoint (block fully covering), so the caller can swap content under it. */
  const run = () =>
    new Promise<void>((resolve) => {
      if (reduce) { resolve(); return; }
      const half = duration.wipe / 2;
      x.value = -screenWidth;
      x.value = withSequence(withTiming(0, { duration: half, ...LINEAR }), withTiming(screenWidth, { duration: half, ...LINEAR }));
      setTimeout(resolve, half);
    });
  return { style, run };
}

// spot — look here: a hard cut (0 ms) to the new target, then the target receives a `stamp`.
// Implemented by CoachMark repositioning without animation and calling useStamp().run on the target.
// count — live countdown: deliberately no animation. Text updates once a second.

export type { SharedValue };
