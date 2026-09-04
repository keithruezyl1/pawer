import { useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { BarangayEntry } from "@pawer/shared";
import { barangays, lgus, displayName } from "@pawer/registry";
import { foldKey } from "../util/fold";
import { color, layout, space } from "../theme/tokens";
import { useJudder } from "../theme/motion";
import { useSounds } from "../theme/sound";
import { useApp } from "../state/AppState";
import { Screen } from "../ui/Screen";
import { T } from "../ui/Text";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Chip } from "../ui/Chip";
import { Chevron } from "../ui/Glyph";
import { CheckBadge, Magnifier, Plus, Warn } from "../ui/Icon";
import { Fade, IconRow } from "../ui/Surface";

/**
 * The barangay picker (PRD FR-2d–g). One screen: search across all 232, eight collapsible LGU
 * groups beneath. Multi-select. Ambiguous names always show their LGU. LGU-wide selection does
 * not exist here — and could not work anyway, since no LGU topic is ever published (D-17).
 *
 * In tour mode (?tour=1) the selection is handed to the tour for map confirmation instead of
 * being added directly (ONBOARDING-AND-TOUR §3, T2 → T4).
 */
export default function Picker() {
  const router = useRouter();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const { prefs, addBarangay, setTourPending } = useApp();
  const judder = useJudder();
  const sounds = useSounds();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<string[]>([]);

  const q = foldKey(query);
  const sections = useMemo(() => {
    const filtered = q
      ? barangays.filter((b) => foldKey(b.display).includes(q) || b.aliases.some((a) => a.includes(q)))
      : barangays;
    return lgus
      .map((l) => ({ lgu: l, data: filtered.filter((b) => b.lgu === l.slug) }))
      .filter((s) => s.data.length > 0)
      .map((s) => ({ ...s, data: q || open[s.lgu.slug] ? s.data : [] }));
  }, [q, open]);

  const total = prefs.barangays.length + picked.filter((p) => !prefs.barangays.includes(p)).length;
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));

  const confirm = () => {
    if (picked.length === 0) { judder.run(); return; }
    if (tour === "1") {
      setTourPending(picked);
      router.back();
      return;
    }
    picked.forEach(addBarangay);
    sounds.areaAdded();
    router.back();
  };

  const renderItem = ({ item }: { item: BarangayEntry }) => {
    const already = prefs.barangays.includes(item.slug);
    const on = already || picked.includes(item.slug);
    return (
      <Pressable
        onPress={() => !already && toggle(item.slug)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on, disabled: already }}
        accessibilityLabel={displayName(item)}
        style={[styles.row, already && styles.rowDisabled]}
      >
        <View style={[styles.box, on && styles.boxOn]}>{on && <View style={styles.tick} />}</View>
        <T v="body">{displayName(item)}</T>
        {already && <View style={styles.added}><CheckBadge size={15} tone={color.slate} /></View>}
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <T v="title" style={styles.title}>{tour === "1" ? "Which barangay?" : "Add areas"}</T>
      <Field value={query} onChangeText={setQuery} placeholder="Search 232 barangays" autoCorrect={false} accessibilityLabel="Search barangays" leading={<Magnifier size={16} tone={color.slate} />} />
      <T v="caption" muted>Your barangay is printed on your Visayan Electric bill.</T>

      {picked.length > 0 && (
        <View style={styles.chips}>
          {picked.map((slug) => { const b = barangays.find((x) => x.slug === slug)!; return <Chip key={slug} barangay={b} onRemove={toggle} />; })}
        </View>
      )}
      {total >= 5 && (
        <IconRow icon={<Warn size={13} tone={color.slate} />} v="caption" muted>
          You'll get alerts for {total} areas, which may be frequent.
        </IconRow>
      )}

      <View style={styles.listWrap}>
      <SectionList
        sections={sections}
        keyExtractor={(b) => b.slug}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Pressable
            onPress={() => !q && setOpen((o) => ({ ...o, [section.lgu.slug]: !o[section.lgu.slug] }))}
            accessibilityRole="button"
            accessibilityState={{ expanded: !!q || !!open[section.lgu.slug] }}
            style={styles.sectionHead}
          >
            <T v="headline">{section.lgu.display}</T>
            {!q && <Chevron size={14} direction={open[section.lgu.slug] ? "up" : "down"} />}
          </Pressable>
        )}
      />
      <Fade height={56} />
      </View>

      {q !== "" && sections.length === 0 && (
        <View style={styles.noMatch}>
          <Magnifier size={34} tone={color.slate} />
          <T v="headline" style={styles.centre}>No barangay matches that</T>
          <T v="body" muted style={styles.centre}>Try fewer letters, or check the spelling against your VECO bill.</T>
        </View>
      )}

      <Animated.View style={[styles.actions, judder.style]}>
        <Button variant="primary" label={tour === "1" ? "Continue" : `Add ${picked.length || ""}`.trim()} icon={<Plus size={15} />} onPress={confirm} disabled={picked.length === 0 && sections.length === 0} />
        <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: space.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  listWrap: { flex: 1, position: "relative" },
  list: { flex: 1, marginTop: space.sm },
  listContent: { paddingBottom: space.lg },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: layout.touchTarget, borderBottomWidth: layout.border, borderColor: color.ink, marginTop: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: layout.touchTarget, paddingVertical: space.xs },
  rowDisabled: { opacity: 0.55 },
  box: { width: 22, height: 22, borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius, alignItems: "center", justifyContent: "center", backgroundColor: color.ground },
  boxOn: { backgroundColor: color.accent },
  tick: { width: 10, height: 10, backgroundColor: color.ink },
  actions: { gap: space.sm, paddingTop: space.md, paddingBottom: space.lg },
  added: { marginLeft: "auto" },
  noMatch: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md },
  centre: { textAlign: "center" },
});
