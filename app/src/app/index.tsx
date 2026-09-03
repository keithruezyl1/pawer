import { useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View, type View as RNView } from "react-native";
import Animated from "react-native-reanimated";
import { Link, useRouter } from "expo-router";
import { color, layout, space } from "../theme/tokens";
import { useTick, useBump } from "../theme/motion";
import { useApp } from "../state/AppState";
import { useStatus } from "../state/useStatus";
import { Screen } from "../ui/Screen";
import { T } from "../ui/Text";
import { Button } from "../ui/Button";
import { Block } from "../ui/Block";
import { StatusField } from "../ui/StatusField";
import { OutageCard } from "../ui/OutageCard";
import { Tour, type Rect } from "../tour/Tour";

export default function Dashboard() {
  const router = useRouter();
  const { prefs, outages, nowMs, fetchedAtMs, refreshing, lastRefreshKind, refresh } = useApp();
  const status = useStatus();
  const tick = useTick();
  const bump = useBump();

  useEffect(() => { if (refreshing) tick.run(); }, [refreshing]);
  useEffect(() => { if (lastRefreshKind === "fresh") bump.run(); }, [lastRefreshKind, fetchedAtMs]);

  const selected = prefs.barangays;
  const mine = outages
    .filter((o) => o.barangays.some((b) => selected.includes(b)))
    .filter((o) => o.parse_status === "failed" || Date.parse(o.end) > nowMs)
    .filter((o) => o.id !== status.activeOutage?.id)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

  // T1 target: the add-area control's on-screen rect.
  const addRef = useRef<RNView>(null);
  const [addRect, setAddRect] = useState<Rect | null>(null);
  const measure = () => addRef.current?.measureInWindow((x, y, width, height) => setAddRect({ x, y, width, height }));

  const showTour = prefs.onboardingDone && !prefs.tourDone;

  return (
    <View style={styles.root}>
      <Screen bleed refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} colors={[color.ink]} tintColor={color.ink} progressBackgroundColor={color.ground} />}>
        <View style={styles.header}>
          <T v="title">PAWER</T>
          <Link href="/settings" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8} style={styles.settings}>
              <View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} />
            </Pressable>
          </Link>
        </View>

        {selected.length === 0 ? (
          <View style={styles.pad}>
            <Block fill={color.ground}>
              <T v="label">TODAY</T>
              <T v="display" style={styles.mt}>No areas yet</T>
              <T v="body" style={styles.mt}>Add the barangay you want alerts for. You can add more than one.</T>
              <View ref={addRef} onLayout={measure} collapsable={false} style={styles.mtLg}>
                <Button variant="primary" label="Add area" onPress={() => router.push("/picker")} />
              </View>
            </Block>
          </View>
        ) : (
          <StatusField status={status} selected={selected} nowMs={nowMs} fetchedAtMs={fetchedAtMs} />
        )}

        {selected.length > 0 && (
          <View style={styles.pad}>
            <View style={styles.sectionHead}>
              <T v="label">UPCOMING</T>
              <Animated.View style={[tick.style, bump.style]}>
                <T v="caption" muted>{lastRefreshKind === "error" ? "Couldn't check — showing saved data" : `${mine.length} scheduled`}</T>
              </Animated.View>
            </View>
            {mine.length === 0 && (
              <Block fill={color.ground} shadow={false} padding={space.lg}>
                <T v="body" muted>Nothing else scheduled for your areas this week.</T>
              </Block>
            )}
            {mine.map((o, i) => (
              <OutageCard key={o.id} outage={o} nowMs={nowMs} enter={i < 3} onPress={() => router.push(`/detail/${o.id}`)} />
            ))}
          </View>
        )}

        <View style={[styles.pad, styles.foot]}>
          <Link href="/all-areas" asChild>
            <Pressable accessibilityRole="link" style={styles.browse}>
              <T v="label">Browse all areas</T><T v="label">›</T>
            </Pressable>
          </Link>
          <T v="caption" muted>Source: Visayan Electric's published advisories</T>
          <T v="caption" muted>PAWER is not affiliated with Visayan Electric. Scheduled outages only.</T>
        </View>
      </Screen>

      {showTour && <Tour addAreaRect={addRect} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: layout.screenMargin, paddingVertical: space.sm },
  settings: { width: layout.touchTarget, height: layout.touchTarget, alignItems: "center", justifyContent: "center", gap: 4 },
  dot: { width: 5, height: 5, backgroundColor: color.ink },
  pad: { paddingHorizontal: layout.screenMargin, gap: layout.cardGap },
  mt: { marginTop: space.sm },
  mtLg: { marginTop: space.xl },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: space.lg },
  foot: { marginTop: space.xl, gap: space.sm },
  browse: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: layout.touchTarget, borderTopWidth: layout.border, borderBottomWidth: layout.border, borderColor: color.ink, marginBottom: space.md },
});
