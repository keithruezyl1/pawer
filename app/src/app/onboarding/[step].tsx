import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { color, layout, space } from "../../theme/tokens";
import { useApp } from "../../state/AppState";
import { Screen } from "../../ui/Screen";
import { T } from "../../ui/Text";
import { Button } from "../../ui/Button";
import { Field } from "../../ui/Field";
import { Block } from "../../ui/Block";
import { Check, Cross } from "../../ui/Glyph";

/**
 * Onboarding S1–S5 — copy verbatim from ONBOARDING-AND-TOUR.md §2. Typographic screens on
 * bare ground: no card, no fill, no illustration, one idea each (DG §6.1). S3 is not skippable.
 */
export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const n = Math.min(5, Math.max(1, Number(step) || 1));
  const router = useRouter();
  const { prefs, setName, completeOnboarding, completeTour } = useApp();
  const [draft, setDraft] = useState(prefs.name ?? "");

  const go = (to: number) => router.replace(`/onboarding/${to}`);
  const finish = async (skipTour: boolean) => {
    completeOnboarding();
    if (skipTour) completeTour();
    router.replace("/");
  };

  return (
    <Screen scroll={false}>
      <View style={styles.body}>
        {n === 1 && (
          <>
            <T v="title">Power advisories exist. Finding them doesn't.</T>
            <T v="body">Visayan Electric publishes every scheduled outage days in advance — buried in a Facebook feed, between everything else.</T>
            <T v="body">Sound familiar?</T>
          </>
        )}
        {n === 2 && (
          <>
            <T v="title">What if it just told you?</T>
            <T v="body">One card. Your barangay only. On your home screen, before it happens.</T>
          </>
        )}
        {n === 3 && (
          <>
            <T v="title">What PAWER can and can't tell you</T>
            <View style={styles.point}><Check /><T v="body" style={styles.pointText}>Scheduled outages, days ahead</T></View>
            <View style={styles.point}><Check /><T v="body" style={styles.pointText}>When one is underway, and when power should return</T></View>
            <Block fill={color.noticeFill} shadow={false} padding={space.lg}>
              <View style={styles.point}><Cross /><T v="body" style={styles.pointText}>Sudden or emergency outages. Visayan Electric doesn't publish these in advance, so PAWER can't warn you about them.</T></View>
            </Block>
            <T v="body" muted>PAWER reads Visayan Electric's public advisories. It isn't made by them and isn't affiliated with them. It shows the published schedule — not the real state of the grid — so don't rely on it for anything medical or safety-critical.</T>
          </>
        )}
        {n === 4 && (
          <>
            <T v="title">What should we call you?</T>
            <Field value={draft} onChangeText={setDraft} placeholder="Your name" autoCapitalize="words" returnKeyType="done" maxLength={40} accessibilityLabel="Your name, optional" />
            <T v="caption" muted>Optional. This stays on your phone — it's never sent anywhere.</T>
          </>
        )}
        {n === 5 && (
          <>
            <T v="title">{prefs.name ? `You're set, ${prefs.name}` : "Welcome to PAWER"}</T>
            <T v="body">Two things left: add your barangay, and put PAWER on your home screen. About a minute.</T>
          </>
        )}
      </View>

      <View style={styles.actions}>
        {n === 1 && <><Button variant="primary" label="It does" onPress={() => go(2)} /><Button variant="ghost" label="Skip" onPress={() => go(3)} /></>}
        {n === 2 && <><Button variant="primary" label="Show me" onPress={() => go(3)} /><Button variant="ghost" label="Skip" onPress={() => go(3)} /></>}
        {n === 3 && <Button variant="primary" label="Got it" onPress={() => go(4)} />}
        {n === 4 && (
          <>
            <Button variant="primary" label="Continue" onPress={() => { setName(draft); void go(5); }} />
            {/* Skip is weighted like Continue — a secondary-styled skip reads as discouragement (DG §6.1). */}
            <Button variant="secondary" label="Skip" onPress={() => { setName(null); void go(5); }} />
          </>
        )}
        {n === 5 && <><Button variant="primary" label="Start" onPress={() => finish(false)} /><Button variant="ghost" label="I'll set it up myself" onPress={() => finish(true)} /></>}
      </View>
      <T v="caption" muted style={styles.step}>{n} of 5</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", gap: space.lg },
  point: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  pointText: { flex: 1 },
  actions: { gap: space.md, marginBottom: space.lg },
  step: { textAlign: "center", marginBottom: layout.screenMargin },
});
