import { useEffect, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";
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
 * Tour overlay. Flat ink scrim drawn as four rectangles around the target — no blur, no mask —
 * with a 2 dp accent ring on the target (one of accent's three permitted homes). Repositioning
 * is a hard cut (`spot`), then the ring `stamp`s.
 */
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
          <View style={[styles.scrim, { left: 0, top: 0, width: W, height: t.y }]} />
          <View style={[styles.scrim, { left: 0, top: t.y, width: t.x, height: t.h }]} />
          <View style={[styles.scrim, { left: t.x + t.w, top: t.y, width: W - t.x - t.w, height: t.h }]} />
          <View style={[styles.scrim, { left: 0, top: t.y + t.h, width: W, height: H - t.y - t.h }]} />
          <Animated.View
            pointerEvents={passThroughTarget ? "none" : "auto"}
            style={[styles.ring, { left: t.x, top: t.y, width: t.w, height: t.h }, stamp.style]}
          />
        </>
      ) : (
        <View style={[styles.scrim, StyleSheet.absoluteFill]} />
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
          <T v="label" tone="ground">Skip tour</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: "absolute", backgroundColor: "rgba(33,36,49,0.72)" },
  ring: { position: "absolute", borderWidth: layout.border, borderColor: color.accent, borderRadius: layout.radius },
  calloutWrap: { position: "absolute", left: layout.screenMargin, right: layout.screenMargin, gap: space.md },
  centered: { top: "30%" },
  callout: {},
  title: { marginBottom: space.sm },
  actions: { marginTop: space.lg, gap: space.md },
  skip: { alignSelf: "center", minHeight: layout.touchTarget, justifyContent: "center" },
});
