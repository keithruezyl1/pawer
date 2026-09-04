import { useState, type ReactNode } from "react";
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
import { Bell, Bolt, Clock, Info, Moon, Pin, Plus, Refresh, Speaker } from "../ui/Icon";
import { Fade, IconRow, SectionLabel } from "../ui/Surface";

const ALERTS: Array<{ key: keyof Prefs["alerts"]; label: string; hint: string; icon: ReactNode }> = [
  { key: "newAdvisory", label: "New advisory", hint: "A new outage is scheduled for your area", icon: <Bell size={16} /> },
  { key: "eveningBefore", label: "Evening before", hint: "Around 8:00 PM the day before", icon: <Moon size={16} /> },
  { key: "hourBefore", label: "An hour before", hint: "Give or take a few minutes", icon: <Clock size={16} /> },
  { key: "restoration", label: "Expected restoration", hint: "When the scheduled window ends", icon: <Bolt size={16} /> },
];

/** Flat list, no nesting (DG §6.5). The only two things to configure: which areas, which alerts. */
export default function Settings() {
  const router = useRouter();
  const { prefs, removeBarangay, setAlert, setName, setSounds, fetchedAtMs, nowMs, refresh, refreshing, resetTour } = useApp();
  const [nameDraft, setNameDraft] = useState(prefs.name ?? "");

  return (
    <Screen>
      <View style={styles.head}>
        <T v="title">Settings</T>
        <Button variant="ghost" label="Done" onPress={() => router.back()} />
      </View>

      <SectionLabel icon={<Pin size={13} />}>MY AREAS</SectionLabel>
      <View style={styles.chips}>
        {prefs.barangays.map((slug) => { const b = findBarangay(slug); return b ? <Chip key={slug} barangay={b} onRemove={removeBarangay} /> : null; })}
        {prefs.barangays.length === 0 && <T v="body" muted>None yet.</T>}
      </View>
      <Button variant="primary" label="Add area" icon={<Plus size={15} />} onPress={() => router.push("/picker")} />
      {prefs.barangays.length >= 5 && <T v="caption" muted>You'll get alerts for {prefs.barangays.length} areas, which may be frequent.</T>}

      <SectionLabel icon={<Bell size={13} />} style={styles.section}>ALERTS</SectionLabel>
      {ALERTS.map((a) => (
        <View key={a.key} style={styles.row}>
          {a.icon}
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

      <View style={styles.row}>
        <Speaker size={16} />
        <View style={styles.rowText}>
          <T v="body">Sounds</T>
          <T v="caption" muted>Two short cues: an area added, and the status changing. Silent mode is respected</T>
        </View>
        <Switch value={prefs.sounds} onValueChange={setSounds} trackColor={{ false: color.surface2, true: color.ink }} thumbColor={color.ground} accessibilityLabel="Sounds" />
      </View>

      <SectionLabel icon={<Refresh size={13} />} style={styles.section}>DATA</SectionLabel>
      <IconRow icon={<Clock size={15} />}>
        {fetchedAtMs ? `Last checked ${formatDateShort(fetchedAtMs, nowMs)}, ${formatTime12h(fetchedAtMs)}` : "Not checked yet"}
      </IconRow>
      <Button label={refreshing ? "Checking…" : "Refresh now"} icon={<Refresh size={15} />} onPress={() => void refresh()} disabled={refreshing} />
      <Button label="Run the tour again" onPress={() => { resetTour(); router.replace("/"); }} />

      <T v="label" style={styles.section}>YOUR NAME</T>
      <Field value={nameDraft} onChangeText={setNameDraft} onEndEditing={() => setName(nameDraft)} placeholder="Optional" maxLength={40} accessibilityLabel="Your name, optional" />
      <T v="caption" muted>Your name never leaves your phone. It isn't sent anywhere.</T>

      <T v="label" style={styles.section}>UPDATE</T>
      <T v="body">Version {Constants.expoConfig?.version ?? "dev"}</T>
      <T v="caption" muted>PAWER is installed as an APK, so it checks for its own updates when it starts.</T>

      <SectionLabel icon={<Info size={13} />} style={styles.section}>ABOUT</SectionLabel>
      {/* The ONLY place the full position appears now — the per-screen lines were cut (D-29). */}
      <T v="body" muted>PAWER reads Visayan Electric's public advisories. It isn't made by them and isn't affiliated with them. It covers scheduled outages only, and shows the published schedule rather than the real state of the grid, so don't rely on it for anything medical or safety critical.</T>
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
