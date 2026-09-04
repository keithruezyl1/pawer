/**
 * The newest advisory, its own section below UPCOMING on the dashboard.
 *
 * "View" opens `source_post_url`, which is a visayanelectric.com post — the only post URL the
 * pipeline stores. D-1 ingests the website rather than scraping Facebook, which is what keeps
 * the parser working on structured text instead of OCR on poster images. There is no Facebook
 * URL to link to.
 */
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { formatDateShort, formatTime12h, type Outage } from "@pawer/shared";
import { color, layout, space } from "../theme/tokens";
import { Block } from "./Block";
import { T } from "./Text";
import { Clock, ExternalLink } from "./Icon";
import { IconRow } from "./Surface";

export function LatestAdvisory({ outage, nowMs }: { outage: Outage; nowMs: number }) {
  const posted = Date.parse(outage.source_published_at);
  return (
    <View style={styles.wrap}>
      <T v="label">LATEST ADVISORY</T>
      <Block fill={color.surface2} padding={space.lg} style={styles.card}>
        <IconRow icon={<Clock size={15} />}>
          Posted {formatDateShort(posted, nowMs)} at {formatTime12h(posted)}
        </IconRow>
        <T v="body" style={styles.summary} numberOfLines={2}>
          {outage.purpose_raw}
        </T>
        <Pressable
          onPress={() => void Linking.openURL(outage.source_post_url)}
          accessibilityRole="link"
          accessibilityLabel="View the original advisory"
          style={styles.link}
        >
          <T v="headline" style={styles.linkText}>View</T>
          <ExternalLink size={13} />
        </Pressable>
      </Block>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm + 2, marginTop: space.xl - 2 },
  card: { marginBottom: layout.shadow },
  summary: { marginTop: space.sm },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs + 2,
    minHeight: layout.touchTarget,
  },
  // Accent's fourth home. The other three are the primary button, the tour ring and the quote
  // rule — a link that opens VECO's own post is the same kind of outward gesture.
  linkText: { fontSize: 15, color: color.accent, textDecorationLine: "underline" },
});
