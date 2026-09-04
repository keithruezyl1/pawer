import { useState, type ReactNode } from "react";
import { Linking, Platform, Pressable, StyleSheet, Switch, View } from "react-native";
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
import { Bell, Bolt, Clock, Grid, Info, LinkedIn, Moon, Pin, Plus, Refresh, Speaker } from "../ui/Icon";
import { Spinner } from "../ui/Spinner";
import { Avatar } from "../ui/Avatar";
import { IconRow, SectionLabel } from "../ui/Surface";
import { widget } from "../platform/widget";

const CREATOR_URL = "https://www.linkedin.com/in/keith-tagarao/";

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
  // Same test the tour uses at T7: API 26+ AND a launcher that honours requestPinAppWidget.
  const [canPin] = useState(
    () => Platform.OS === "android" && Number(Platform.Version) >= 26 && widget.isPinSupported(),
  );

  return (
    <View style={styles.root}>
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

      <IconRow icon={<Clock size={15} />} style={styles.section}>
        {fetchedAtMs ? `Last checked ${formatDateShort(fetchedAtMs, nowMs)}, ${formatTime12h(fetchedAtMs)}` : "Not checked yet"}
      </IconRow>
      <Button
        label={refreshing ? "Checking" : "Refresh now"}
        icon={refreshing ? <Spinner scale={2} /> : <Refresh size={15} />}
        onPress={() => void refresh()}
        disabled={refreshing}
      />
      <Button label="Run the tour again" onPress={() => { resetTour(); router.replace("/"); }} />

      <SectionLabel icon={<Grid size={13} />} style={styles.section}>WIDGET</SectionLabel>
      {canPin ? (
        <>
          <Button label="Add widget" icon={<Plus size={15} />} onPress={() => void widget.requestPin()} />
          <T v="caption" muted>Puts today's status on your home screen. Your launcher will ask where to place it.</T>
        </>
      ) : (
        <T v="caption" muted>
          Add it the usual way instead, by long pressing your home screen and looking for PAWER in the widget list.
        </T>
      )}

      <T v="label" style={styles.section}>YOUR NAME</T>
      <View style={styles.nameRow}>
        <Avatar seed={prefs.name ?? ""} initial={prefs.name ?? undefined} size={48} />
        <Field
          value={nameDraft}
          onChangeText={setNameDraft}
          onEndEditing={() => setName(nameDraft)}
          placeholder="Optional"
          maxLength={40}
          accessibilityLabel="Your name, optional"
          style={styles.nameField}
        />
      </View>
      <T v="caption" muted>Stays on your phone. Never sent anywhere.</T>

      <T v="label" style={styles.section}>UPDATE</T>
      <T v="body">Version {Constants.expoConfig?.version ?? "dev"}</T>

      <SectionLabel icon={<Info size={13} />} style={styles.section}>ABOUT</SectionLabel>
      <T v="body">Nobody likes having their power cut. What's worse is not knowing it was coming, even when it was announced days ahead.</T>
      <T v="body" style={styles.para}>PAWER does one thing and tries to do it well. It tells you when Visayan Electric has scheduled an interruption for your area, instead of leaving it buried in a social media feed.</T>
      <T v="body" style={styles.para}>Pero bitaw VECO, kanusa mani mahuman?</T>
      {/* D-29: the legal position depends on this disclosure existing and being reachable, so it
          survives the copy pass even though the paragraph around it was replaced. */}
      <T v="caption" muted style={styles.para}>PAWER reads Visayan Electric's public advisories and isn't affiliated with them. It shows the published schedule, not the live state of the grid.</T>

      <T v="body" style={styles.section}>Follow PWR's creator</T>
      <Pressable
        onPress={() => void Linking.openURL(CREATOR_URL)}
        accessibilityRole="link"
        accessibilityLabel="Follow PWR's creator on LinkedIn"
        style={styles.link}
      >
        <LinkedIn size={16} />
        <T v="body" style={styles.linkText}>linkedin.com/in/keith-tagarao</T>
      </Pressable>
    </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  section: { marginTop: space.xl },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: layout.touchTarget, borderBottomWidth: layout.border, borderColor: color.surface2, paddingVertical: space.sm, gap: space.md },
  rowText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  nameField: { flex: 1 },
  para: { marginTop: space.md },
  link: { flexDirection: "row", alignItems: "center", gap: space.sm + 2, minHeight: layout.touchTarget },
  // Accent's fifth home, and the same treatment as the advisory link: both point off the app.
  linkText: { color: color.accent, textDecorationLine: "underline" },
});
