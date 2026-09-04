import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { barangays } from "@pawer/registry";
import { foldKey } from "../util/fold";
import { color, layout, space } from "../theme/tokens";
import { useApp } from "../state/AppState";
import { Screen } from "../ui/Screen";
import { T } from "../ui/Text";
import { Field } from "../ui/Field";
import { OutageCard } from "../ui/OutageCard";
import { Chevron } from "../ui/Glyph";
import { ClearMark, Magnifier } from "../ui/Icon";

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

  const live = outages.filter((o) => o.parse_status === "failed" || Date.parse(o.end) > nowMs);
  const matching = useMemo(() => {
    const slugs = q
      ? new Set(barangays.filter((b) => foldKey(b.display).includes(q) || b.aliases.some((a) => a.includes(q))).map((b) => b.slug))
      : null;
    return live
      .filter((o) => !slugs || o.barangays.some((b) => slugs.has(b)))
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }, [outages, q, nowMs]);

  return (
    <View style={styles.root}>
      <Screen>
        <View style={styles.head}>
          <T v="title">All areas</T>
          {/* A bare chevron. On a phone the word "Back" earns nothing the arrow does not. */}
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={styles.back}>
            <Chevron size={17} direction="left" />
          </Pressable>
        </View>

        <Field
          value={query}
          onChangeText={setQuery}
          placeholder="Search by barangay"
          autoCorrect={false}
          accessibilityLabel="Search by barangay"
          leading={<Magnifier size={16} tone={color.slate} />}
        />
        <T v="caption" muted>{matching.length} scheduled. Viewing here doesn't add alerts.</T>

        {matching.map((o, i) => (
          <OutageCard
            key={o.id}
            outage={o}
            nowMs={nowMs}
            index={i}
            alwaysLgu
            following={o.barangays.some((b) => prefs.barangays.includes(b))}
            onPress={() => router.push(`/detail/${o.id}`)}
          />
        ))}

        {/* Two different nothings: your search missed, or the franchise is quiet. */}
        {matching.length === 0 && q !== "" && (
          <View style={styles.empty}>
            <Magnifier size={34} tone={color.slate} />
            <T v="body" muted style={styles.centre}>No scheduled outages match.</T>
          </View>
        )}
        {matching.length === 0 && q === "" && (
          <View style={styles.empty}>
            <ClearMark size={58} />
            <T v="headline" style={styles.centre}>Nothing scheduled right now</T>
            <T v="body" muted style={styles.centre}>
              Visayan Electric has not published any interruptions for the coming week.
            </T>
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { width: layout.touchTarget, height: layout.touchTarget, alignItems: "flex-end", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", gap: space.md, marginTop: space.xxl + space.lg },
  centre: { textAlign: "center" },
});
