import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { formatDateShort, formatTime12h } from "@pawer/shared";
import { findBarangay } from "@pawer/registry";
import { color, layout, space } from "../theme/tokens";
import { useApp } from "../state/AppState";
import type { Prefs } from "../data/store";
import { Screen } from "../ui/Screen";
import { T } from "../ui/Text";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Chip } from "../ui/Chip";

const ALERTS: Array<{ key: keyof Prefs["alerts"]; label: string; hint: string }> = [
  { key: "newAdvisory", label: "New advisory", hint: "When a new outage is scheduled for your area" },
  { key: "eveningBefore", label: "Evening before", hint: "Around 8:00 PM the day before" },
  { key: "hourBefore", label: "About an hour before", hint: "Inexact by design — within a few minutes" },
  { key: "restoration", label: "Expected restoration", hint: "When the scheduled window ends" },
];

/** Flat list, no nesting (DG §6.5). The only two things to configure: which areas, which alerts. */
export default function Settings() {
  const router = useRouter();
  const { prefs, removeBarangay, setAlert, setName, fetchedAtMs, nowMs, refresh, refreshing, resetTour } = useApp();
  const [nameDraft, setNameDraft] = useState(prefs.name ?? "");

  return (
    <Screen>
      <View style={styles.head}>
        <T v="title">Settings</T>
        <Button variant="ghost" label="Done" onPress={() => router.back()} />
      </View>

      <T v="label">MY AREAS</T>
      <View style={styles.chips}>
        {prefs.barangays.map((slug) => { const b = findBarangay(slug); return b ? <Chip key={slug} barangay={b} onRemove={removeBarangay} /> : null; })}
        {prefs.barangays.length === 0 && <T v="body" muted>None yet.</T>}
      </View>
      <Button variant="primary" label="Add area" onPress={() => router.push("/picker")} />
      {prefs.barangays.length >= 5 && <T v="caption" muted>You'll get alerts for {prefs.barangays.length} areas, which may be frequent.</T>}

      <T v="label" style={styles.section}>ALERTS</T>
      {ALERTS.map((a) => (
        <View key={a.key} style={styles.row}>
          <View style={styles.rowText}>
            <T v="body">{a.label}</T>
            <T v="caption" muted>{a.hint}</T>
          </View>
          <Switch
            value={prefs.alerts[a.key]}
            onValueChange={(v) => setAlert(a.key, v)}
            trackColor={{ false: color.surface2, true: color.ink }}
            thumbColor={color.ground}
            accessibilityLabel={a.label}
          />
        </View>
      ))}

      <T v="label" style={styles.section}>DATA</T>
      <T v="body">{fetchedAtMs ? `Last checked ${formatDateShort(fetchedAtMs, nowMs)}, ${formatTime12h(fetchedAtMs)}` : "Not checked yet"}</T>
      <Button label={refreshing ? "Checking…" : "Refresh now"} onPress={() => void refresh()} disabled={refreshing} />
      <Button label="Run the tour again" onPress={() => { resetTour(); router.replace("/"); }} />

      <T v="label" style={styles.section}>YOUR NAME</T>
      <Field value={nameDraft} onChangeText={setNameDraft} onEndEditing={() => setName(nameDraft)} placeholder="Optional" maxLength={40} accessibilityLabel="Your name, optional" />
      <T v="caption" muted>Your name never leaves your phone. It isn't sent anywhere.</T>

      <T v="label" style={styles.section}>UPDATE</T>
      <T v="body">Version {Constants.expoConfig?.version ?? "dev"}</T>
      <T v="caption" muted>PAWER is installed as an APK, so it checks for its own updates when it starts.</T>

      <T v="label" style={styles.section}>ABOUT</T>
      <T v="body">PAWER reads Visayan Electric's public service-interruption advisories and shows the ones scheduled for your barangay.</T>
      <T v="body" muted>It isn't made by Visayan Electric and isn't affiliated with them.</T>
      <T v="body" muted>It covers scheduled outages only. Sudden or emergency outages aren't published in advance, so PAWER can't warn you about them.</T>
      <T v="body" muted>PAWER shows the published schedule, not the real state of the grid. Actual outages may differ in timing or happen without notice. Don't rely on it for medical or safety-critical needs.</T>
      <T v="caption" muted style={styles.section}>No accounts. No location. Nothing about you is stored on any server.</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  section: { marginTop: space.xl },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: layout.touchTarget, borderBottomWidth: layout.border, borderColor: color.surface2, paddingVertical: space.sm, gap: space.md },
  rowText: { flex: 1 },
});
