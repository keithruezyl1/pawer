import { useEffect, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { color, layout, space } from "../theme/tokens";
import { useStamp } from "../theme/motion";
import { Block } from "./Block";
import { Button } from "./Button";
import { T } from "./Text";

export interface Rect { x: number; y: number; width: number; height: number }

export interface CoachMarkProps extends PropsWithChildren {
  /** Screen-space rect of the highlighted control. Null = centred callout with no spotlight. */
  target: Rect | null;
  title?: string;
  body: string;
  primary: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  onSkip: () => void;
  /** Let taps pass through to the target itself (T1: the user taps the real add-area button). */
  passThroughTarget?: boolean;
}

/**
 * Tour overlay. The scrim is four rectangles around the target, so the highlighted control stays
 * sharp while everything else both dims and blurs (D-44), with a 2 dp accent ring on the target
 * (one of accent's three permitted homes). Repositioning is a hard cut (`spot`), then the ring
 * `stamp`s.
 */

/**
 * One panel of the scrim: blur behind, then the calibrated 32% ink over the top.
 *
 * The blur is the ONE place NFR-4's no-blur rule is relaxed. It exists only while the tour is on
 * screen, it is never on a surface the user lives in, and it is what makes "everything except
 * this" read as background rather than as a tinted copy of the same screen. Android needs
 * `experimentalBlurMethod` to blur for real; without it the view is a plain translucent wash,
 * which is exactly the old behaviour, so an unsupported device degrades to what shipped before.
 */
function Scrim({ style }: { style: StyleProp<ViewStyle> }) {
  return (
    <BlurView intensity={14} tint="dark" experimentalBlurMethod="dimezisBlurView" style={[styles.scrim, style]}>
      <View style={styles.dim} />
    </BlurView>
  );
}
export function CoachMark({ target, title, body, primary, secondary, onSkip, passThroughTarget, children }: CoachMarkProps) {
  const { width: W, height: H } = useWindowDimensions();
  const stamp = useStamp();
  useEffect(() => { stamp.run(); }, [target?.x, target?.y]);

  const pad = 6;
  const t = target ? { x: target.x - pad, y: target.y - pad, w: target.width + pad * 2, h: target.height + pad * 2 } : null;
  const calloutBelow = t ? t.y + t.h + 200 < H : true;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* scrim as four rects so the target stays fully visible and (optionally) tappable */}
      {t ? (
        <>
          <Scrim style={{ left: 0, top: 0, width: W, height: t.y }} />
          <Scrim style={{ left: 0, top: t.y, width: t.x, height: t.h }} />
          <Scrim style={{ left: t.x + t.w, top: t.y, width: W - t.x - t.w, height: t.h }} />
          <Scrim style={{ left: 0, top: t.y + t.h, width: W, height: H - t.y - t.h }} />
          <Animated.View
            pointerEvents={passThroughTarget ? "none" : "auto"}
            style={[styles.ring, { left: t.x, top: t.y, width: t.w, height: t.h }, stamp.style]}
          />
        </>
      ) : (
        <Scrim style={StyleSheet.absoluteFill} />
      )}

      <View style={[styles.calloutWrap, t ? (calloutBelow ? { top: t.y + t.h + space.xl } : { bottom: H - t.y + space.xl }) : styles.centered]} pointerEvents="box-none">
        <Block fill={color.ground} style={styles.callout}>
          {title ? <T v="title" style={styles.title}>{title}</T> : null}
          {children}
          {body ? <T v="body">{body}</T> : null}
          <View style={styles.actions}>
            <Button label={primary.label} onPress={primary.onPress} variant="primary" />
            {secondary && <Button label={secondary.label} onPress={secondary.onPress} variant="secondary" />}
          </View>
        </Block>
        <Pressable onPress={onSkip} accessibilityRole="button" style={styles.skip} hitSlop={8}>
          <T v="label">Skip for now</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: "absolute", overflow: "hidden" },
  // 32%, not 72%: a recede rather than a blackout, so the user can still see the screen
  // they are being shown. White text fails on this (1.94:1), so Skip is ink. Painted as a child
  // of the BlurView rather than as its backgroundColor, so the blur stays behind the tint.
  dim: { flex: 1, backgroundColor: "rgba(33,36,49,0.32)" },
  ring: { position: "absolute", borderWidth: layout.border, borderColor: color.accent, borderRadius: layout.radius },
  calloutWrap: { position: "absolute", left: layout.screenMargin, right: layout.screenMargin, gap: space.md },
  centered: { top: "30%" },
  callout: {},
  title: { marginBottom: space.sm },
  actions: { marginTop: space.lg, gap: space.md },
  skip: { alignSelf: "center", minHeight: layout.touchTarget, justifyContent: "center" },
});
