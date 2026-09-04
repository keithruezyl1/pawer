import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDateShort, formatDuration, formatWindow } from "@pawer/shared";
import { color, layout, space } from "../../theme/tokens";
import { useApp } from "../../state/AppState";
import { Screen } from "../../ui/Screen";
import { T } from "../../ui/Text";
import { Button } from "../../ui/Button";
import { Block } from "../../ui/Block";
import { barangayLabel } from "../../ui/OutageCard";
import { Chevron } from "../../ui/Glyph";
import { Clock, ExternalLink, Note, Pin, Warn } from "../../ui/Icon";
import { IconRow } from "../../ui/Surface";

/** Detail sheet (DG §6.3): structured summary, then VECO's text verbatim under an accent rule. */
export default function Detail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outages, nowMs } = useApp();
  const o = outages.find((x) => x.id === id);

  const Back = () => (
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={styles.back}>
      <Chevron size={17} direction="left" />
    </Pressable>
  );

  if (!o) {
    return (
      <Screen>
        <View style={styles.head}>
          <T v="title">Not found</T>
          <Back />
        </View>
        <IconRow icon={<Warn size={16} tone={color.slate} />} v="body" muted align="flex-start" style={styles.mt}>
          This advisory is no longer in the saved data.
        </IconRow>
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
        <Back />
      </View>

      {/* A failed parse hides the time entirely rather than guessing it. */}
      {!unreadable && (
        <IconRow icon={<Clock size={16} />} v="headline">
          {formatWindow(start, end)} · {formatDuration(o.duration_minutes)}
        </IconRow>
      )}

      <View style={styles.chips}>
        {o.barangays.map((slug) => (
          <View key={slug} style={styles.chip}>
            <Pin size={12} />
            <T v="label">{barangayLabel(slug)}</T>
          </View>
        ))}
      </View>

      {o.parse_status !== "parsed" && (
        <Block fill={color.noticeFill} shadow={false} padding={space.lg}>
          <IconRow icon={<Warn size={16} />} v="body" align="flex-start">
            {unreadable
              ? "PAWER couldn't read the time on this advisory. The original is linked below."
              : "Some area names couldn't be matched. The original is linked below."}
          </IconRow>
          {o.unknown_area_tokens.length > 0 && (
            <T v="caption" muted style={styles.mt}>Couldn't match {o.unknown_area_tokens.join(", ")}</T>
          )}
        </Block>
      )}

      <T v="label" style={styles.mtLg}>FROM VISAYAN ELECTRIC</T>
      <View style={styles.quote}>
        <IconRow icon={<Pin size={13} tone={color.slate} />} v="caption" muted>Areas affected</IconRow>
        <T v="body">{o.areas_raw}</T>
        <IconRow icon={<Note size={13} tone={color.slate} />} v="caption" muted style={styles.mt}>Purpose</IconRow>
        <T v="body">{o.purpose_raw}</T>
      </View>
      <T v="caption" muted>Quoted as published. Outages often affect only part of a barangay.</T>

      <Button
        label="View original post"
        icon={<ExternalLink size={14} tone={color.ink} />}
        onPress={() => void Linking.openURL(o.source_post_url)}
        style={styles.mtLg}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  back: { width: layout.touchTarget, height: layout.touchTarget, alignItems: "flex-end", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius,
    paddingLeft: space.sm - 1, paddingRight: space.sm + 1, paddingVertical: 3,
  },
  mt: { marginTop: space.sm },
  mtLg: { marginTop: space.lg },
  quote: { borderLeftWidth: 3, borderLeftColor: color.accent, paddingLeft: space.lg, gap: space.xs + 2 },
});
