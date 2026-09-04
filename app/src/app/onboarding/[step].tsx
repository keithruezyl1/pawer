import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { color, space } from "../../theme/tokens";
import { useApp } from "../../state/AppState";
import { Screen } from "../../ui/Screen";
import { T } from "../../ui/Text";
import { Button } from "../../ui/Button";
import { Field } from "../../ui/Field";
import { Block } from "../../ui/Block";
import { Check, Cross } from "../../ui/Glyph";
import { Dots } from "../../ui/Dots";
import { Burst, Disc, Floater, Pill, Sparkle, Squiggle } from "../../ui/Shapes";

/**
 * Onboarding S1–S5. Copy is Keith's, edited on the design canvas — not the wording in
 * ONBOARDING-AND-TOUR. The call-to-action buttons are Cebuano (D-30); every status line and all
 * quoted VECO text stays English, so nothing carrying a time, a place or a warning is translated.
 *
 * Typographic screens on the checkerboard ground with shapes drifting behind. S3 is not skippable.
 */
export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const n = Math.min(5, Math.max(1, Number(step) || 1));
  const router = useRouter();
  const { prefs, setName, completeOnboarding, completeTour } = useApp();
  const [draft, setDraft] = useState(prefs.name ?? "");

  const go = (to: number) => router.replace(`/onboarding/${to}`);
  const finish = (skipTour: boolean) => {
    completeOnboarding();
    if (skipTour) completeTour();
    router.replace("/");
  };

  /** A different arrangement per screen, so the run has rhythm instead of one corner motif. */
  const shapes: Record<number, ReactNode> = {
    1: (
      <>
        <Floater motion="turn" style={{ top: 40, right: -26 }}><Burst size={96} /></Floater>
        <Floater motion="bob" delay={300} style={{ top: 176, left: -16 }}><Squiggle width={84} height={30} /></Floater>
        <Floater motion="drift" delay={900} style={{ bottom: 270, right: 30 }}><Disc size={30} fill={color.status.ongoing} /></Floater>
      </>
    ),
    2: (
      <>
        <Floater motion="drift" style={{ top: 60, left: -36 }}><Pill width={120} height={40} fill={color.status.upcoming} /></Floater>
        <Floater motion="bob" delay={500} style={{ top: 200, right: -10 }}><Sparkle size={46} fill={color.status.clear} /></Floater>
        <Floater motion="drift" delay={1100} style={{ bottom: 250, left: -22 }}><Disc size={64} fill={color.accent} /></Floater>
      </>
    ),
    3: (
      <>
        <Floater motion="turn" style={{ top: 52, right: -14 }}><Burst size={78} /></Floater>
        <Floater motion="drift" delay={400} style={{ top: 150, left: -12 }}><Sparkle size={40} /></Floater>
        <Floater motion="bob" delay={1000} style={{ top: 250, right: 42 }}><Disc size={26} /></Floater>
      </>
    ),
    4: (
      <>
        <Floater motion="drift" style={{ top: 70, right: -16 }}><Sparkle size={52} /></Floater>
        <Floater motion="bob" delay={600} style={{ top: 210, left: -30 }}><Pill width={92} height={34} fill={color.status.clear} /></Floater>
      </>
    ),
    5: (
      <>
        <Floater motion="turn" style={{ top: 44, left: -34 }}><Burst size={104} fill={color.status.clear} /></Floater>
        <Floater motion="drift" delay={400} style={{ top: 168, right: -12 }}><Sparkle size={44} fill={color.status.ended} /></Floater>
        <Floater motion="bob" delay={200} style={{ bottom: 280, left: -10 }}><Squiggle width={76} height={28} /></Floater>
      </>
    ),
  };

  return (
    <Screen scroll={false}>
      {shapes[n]}
      <View style={styles.body}>
        {n === 1 && (
          <>
            <T v="title">Power advisories exist, keeping track is a hassle.</T>
            <T v="body">Visayan Electric publishes every scheduled outage days ahead. The problem is it sits buried in social media feeds, between everything else.</T>
            <T v="body">Sound familiar?</T>
          </>
        )}
        {n === 2 && (
          <>
            <T v="title">What if it just told you?</T>
            <T v="body">In one card. Your barangay, on your home screen, before it happens.</T>
          </>
        )}
        {n === 3 && (
          <>
            <T v="title">What PAWER can and can't tell you</T>
            <View style={styles.point}><Check /><T v="body" style={styles.pointText}>Scheduled outages, days ahead</T></View>
            <View style={styles.point}><Check /><T v="body" style={styles.pointText}>When one starts, and when the power should be back</T></View>
            <Block fill={color.noticeFill} padding={space.lg}>
              <View style={styles.point}><Cross /><T v="body" style={styles.pointText}>Sudden outages. Visayan Electric doesn't publish those ahead, so PAWER can't warn you.</T></View>
            </Block>
            <T v="caption" muted>PAWER is in its early stages. Future updates include improved announcement frequency and accuracy, as well as crowd-gathered info on power conditions.</T>
          </>
        )}
        {n === 4 && (
          <>
            <T v="title">What should we call you?</T>
            <Field value={draft} onChangeText={setDraft} placeholder="Your name" autoCapitalize="words" returnKeyType="done" maxLength={40} accessibilityLabel="Your name, optional" />
            <T v="caption" muted>Optional. Stays on your phone.</T>
          </>
        )}
        {n === 5 && (
          <>
            <T v="title">{prefs.name ? `You're set, ${prefs.name}` : "Welcome to PAWER"}</T>
            <T v="body">Let's get started by adding your barangay.</T>
          </>
        )}
      </View>

      <View style={styles.actions}>
        {n === 1 && <><Button variant="primary" label="Mao jud" onPress={() => go(2)} /><Button variant="ghost" label="Skip" onPress={() => go(3)} /></>}
        {n === 2 && <><Button variant="primary" label="Sure eyyyy?" onPress={() => go(3)} /><Button variant="ghost" label="Skip" onPress={() => go(3)} /></>}
        {n === 3 && <Button variant="primary" label="Gegege" onPress={() => go(4)} />}
        {n === 4 && (
          <>
            <Button variant="primary" label="Continue" onPress={() => { setName(draft); go(5); }} />
            {/* Skip is weighted like Continue — a secondary-styled skip reads as discouragement (DG §6.1). */}
            <Button variant="secondary" label="Skip" onPress={() => { setName(null); go(5); }} />
          </>
        )}
        {n === 5 && <><Button variant="primary" label="Start" onPress={() => finish(false)} /><Button variant="ghost" label="I'll set it up myself" onPress={() => finish(true)} /></>}
      </View>

      <View style={styles.dots}><Dots active={n} /></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", gap: space.lg },
  point: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  pointText: { flex: 1 },
  actions: { gap: space.md, marginBottom: space.lg },
  dots: { marginBottom: space.xl },
});
