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
import { LatestAdvisory } from "../ui/LatestAdvisory";
import { Chevron } from "../ui/Glyph";
import { Clock, Plus } from "../ui/Icon";
import { Fade, IconRow } from "../ui/Surface";
import { CardSkeleton, FetchingNote, HeroSkeleton } from "../ui/Skeleton";
import { OfflineState } from "../ui/states";
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

  /** Newest by publication, not by outage start — this section is about the announcement. */
  const latest = outages.length
    ? outages.reduce((a, b) => (Date.parse(b.source_published_at) > Date.parse(a.source_published_at) ? b : a))
    : null;

  // T1 target: the add-area control's on-screen rect.
  const addRef = useRef<RNView>(null);
  const [addRect, setAddRect] = useState<Rect | null>(null);
  const measure = () => addRef.current?.measureInWindow((x, y, width, height) => setAddRect({ x, y, width, height }));

  const showTour = prefs.onboardingDone && !prefs.tourDone;
  const nothingSaved = fetchedAtMs === 0 && outages.length === 0;
  /** Nothing cached and no verdict yet: the only moment a skeleton is honest. */
  const hydrating = nothingSaved && lastRefreshKind !== "error";
  /**
   * A full-screen error is ONLY correct with nothing to fall back on. Once a schedule is saved,
   * a failed check is a caption on real data, never a screen that hides it.
   */
  const deadEnd = nothingSaved && lastRefreshKind === "error";

  if (deadEnd) return <OfflineState onRetry={() => void refresh()} />;

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

        {hydrating ? (
          <>
            <HeroSkeleton />
            <View style={styles.pad}>
              <T v="label" muted style={styles.sectionTop}>UPCOMING</T>
              <CardSkeleton />
              <CardSkeleton widths={["38%", "66%", "34%"]} />
              <View style={styles.fetching}><FetchingNote /></View>
            </View>
          </>
        ) : selected.length === 0 ? (
          <View style={styles.pad}>
            <Block fill={color.ground}>
              <T v="label">TODAY</T>
              <T v="display" style={styles.mt}>No areas yet</T>
              <T v="body" style={styles.mt}>Add your barangay to see its schedule.</T>
              <View ref={addRef} onLayout={measure} collapsable={false} style={styles.mtLg}>
                <Button variant="primary" label="Add area" icon={<Plus size={15} />} onPress={() => router.push("/picker")} />
              </View>
            </Block>
          </View>
        ) : (
          <StatusField status={status} selected={selected} nowMs={nowMs} fetchedAtMs={fetchedAtMs} />
        )}

        {!hydrating && selected.length > 0 && (
          <View style={styles.pad}>
            <View style={styles.meta}>
              <IconRow icon={<Clock size={12} tone={color.slate} />} v="caption" muted gap={6}>
                {status.isStale ? "Data may be outdated" : "Up to date"}
              </IconRow>
              <Animated.View style={[tick.style, bump.style]}>
                <T v="caption" muted>
                  {lastRefreshKind === "error" ? "Couldn't check. Showing saved data." : `${mine.length} scheduled`}
                </T>
              </Animated.View>
            </View>
            <T v="label" style={styles.sectionTop}>UPCOMING</T>
            {mine.length === 0 && (
              <Block fill={color.tint.clear} padding={space.lg} style={styles.nothing}>
                <T v="body">Nothing else scheduled this week.</T>
              </Block>
            )}
            {mine.map((o, i) => (
              <OutageCard key={o.id} outage={o} nowMs={nowMs} index={i} enter={i < 3} onPress={() => router.push(`/detail/${o.id}`)} />
            ))}
          </View>
        )}

        {!hydrating && latest && (
          <View style={styles.pad}>
            <LatestAdvisory outage={latest} nowMs={nowMs} />
          </View>
        )}

        {/* Bottom right, a real button rather than a full-width rule. */}
        <View style={styles.browseWrap}>
          <Link href="/all-areas" asChild>
            <Pressable accessibilityRole="link">
              <Block fill={color.ground} padding={0} style={styles.browse}>
                <View style={styles.browseInner}>
                  <T v="headline" style={styles.browseLabel}>Browse all areas</T>
                  <Chevron size={14} />
                </View>
              </Block>
            </Pressable>
          </Link>
        </View>
      </Screen>

      <Fade />
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
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xs },
  sectionTop: { marginTop: space.xs },
  nothing: { marginBottom: layout.shadow },
  fetching: { marginTop: space.md },
  browseWrap: { paddingHorizontal: layout.screenMargin, marginTop: space.xl - 2, alignItems: "flex-end" },
  browse: { alignSelf: "flex-end" },
  browseInner: {
    minHeight: layout.touchTarget,
    flexDirection: "row", alignItems: "center", gap: space.sm + 1,
    paddingHorizontal: space.lg + 2,
  },
  browseLabel: { fontSize: 15 },
});
