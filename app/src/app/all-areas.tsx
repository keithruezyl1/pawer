import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { barangays } from "@pawer/registry";
import { foldKey } from "../util/fold";
import { space } from "../theme/tokens";
import { useApp } from "../state/AppState";
import { Screen } from "../ui/Screen";
import { T } from "../ui/Text";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { OutageCard } from "../ui/OutageCard";

/**
 * All areas (PRD FR-7a–c, DG §6.4): every parsed interruption across the franchise, searchable by
 * barangay. No status hero, no subscribe affordance. Every name carries its LGU here — the screen
 * spans eight LGUs, so "San Roque" alone is genuinely ambiguous in a way it never is on the dashboard.
 */
export default function AllAreas() {
  const router = useRouter();
  const { outages, prefs, nowMs } = useApp();
  const [query, setQuery] = useState("");
  const q = foldKey(query);

  const matching = useMemo(() => {
    const slugs = q
      ? new Set(barangays.filter((b) => foldKey(b.display).includes(q) || b.aliases.some((a) => a.includes(q))).map((b) => b.slug))
      : null;
    return outages
      .filter((o) => o.parse_status === "failed" || Date.parse(o.end) > nowMs)
      .filter((o) => !slugs || o.barangays.some((b) => slugs.has(b)))
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }, [outages, q, nowMs]);

  return (
    <Screen>
      <View style={styles.head}>
        <T v="title">All areas</T>
        <Button variant="ghost" label="Back" onPress={() => router.back()} />
      </View>
      <Field value={query} onChangeText={setQuery} placeholder="Search by barangay" autoCorrect={false} accessibilityLabel="Search by barangay" />
      <T v="caption" muted>{matching.length} scheduled across Visayan Electric's franchise. Viewing here doesn't add alerts — add areas in Settings.</T>
      {matching.map((o) => (
        <OutageCard
          key={o.id}
          outage={o}
          nowMs={nowMs}
          alwaysLgu
          following={o.barangays.some((b) => prefs.barangays.includes(b))}
          onPress={() => router.push(`/detail/${o.id}`)}
        />
      ))}
      {matching.length === 0 && <T v="body" muted style={styles.empty}>No scheduled outages match.</T>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empty: { marginTop: space.xl },
});
