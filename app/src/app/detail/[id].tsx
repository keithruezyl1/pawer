import { Linking, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDateShort, formatDuration, formatWindow } from "@pawer/shared";
import { color, layout, space } from "../../theme/tokens";
import { useApp } from "../../state/AppState";
import { Screen } from "../../ui/Screen";
import { T } from "../../ui/Text";
import { Button } from "../../ui/Button";
import { Block } from "../../ui/Block";
import { barangayLabel } from "../../ui/OutageCard";

/** Detail sheet (DG §6.3): structured summary, then VECO's text verbatim under an accent rule. */
export default function Detail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outages, nowMs } = useApp();
  const o = outages.find((x) => x.id === id);

  if (!o) {
    return (
      <Screen>
        <T v="title">Not found</T>
        <T v="body" muted>This advisory is no longer in the saved data.</T>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const start = Date.parse(o.start);
  const end = Date.parse(o.end);
  const unreadable = o.parse_status === "failed";

  return (
    <Screen>
      <View style={styles.head}>
        <T v="title">{unreadable ? "Advisory" : formatDateShort(start, nowMs)}</T>
        <Button variant="ghost" label="Back" onPress={() => router.back()} />
      </View>

      {!unreadable && <T v="headline">{formatWindow(start, end)} · {formatDuration(o.duration_minutes)}</T>}

      <View style={styles.chips}>
        {o.barangays.map((slug) => (
          <View key={slug} style={styles.chip}><T v="label">{barangayLabel(slug)}</T></View>
        ))}
      </View>

      {o.parse_status !== "parsed" && (
        <Block fill={color.noticeFill} shadow={false} padding={space.lg}>
          <T v="body">
            {unreadable
              ? "PAWER couldn't read the time on this advisory. The original is linked below."
              : "PAWER couldn't match every area name in this advisory. The original is linked below."}
          </T>
          {o.unknown_area_tokens.length > 0 && <T v="caption" muted style={styles.mt}>Unmatched: {o.unknown_area_tokens.join(", ")}</T>}
        </Block>
      )}

      <T v="label" style={styles.mtLg}>FROM VISAYAN ELECTRIC</T>
      <View style={styles.quote}>
        <T v="caption" muted>Areas affected</T>
        <T v="body">{o.areas_raw}</T>
        <T v="caption" muted style={styles.mt}>Purpose</T>
        <T v="body">{o.purpose_raw}</T>
      </View>
      <T v="caption" muted>Quoted exactly as published, including any typos. Outages usually affect only part of a barangay.</T>

      <Button label="View original post" onPress={() => void Linking.openURL(o.source_post_url)} style={styles.mtLg} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius, paddingHorizontal: space.sm, paddingVertical: 2 },
  mt: { marginTop: space.sm },
  mtLg: { marginTop: space.lg },
  quote: { borderLeftWidth: layout.border, borderLeftColor: color.accent, paddingLeft: space.lg, gap: space.xs },
});
