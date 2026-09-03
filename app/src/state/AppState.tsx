import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { AppState as RNAppState } from "react-native";
import type { Outage } from "@pawer/shared";
import { feedSource } from "../data/feed";
import { store, type Prefs } from "../data/store";

const FOREGROUND_REFRESH_AFTER_MS = 60 * 60 * 1000; // FR-15

export interface AppStateValue {
  prefs: Prefs;
  outages: Outage[];
  fetchedAtMs: number;
  refreshing: boolean;
  lastRefreshKind: "fresh" | "unchanged" | "error" | null;
  /** Manila clock, ticking once a second (drives countdowns; `count` is no animation). */
  nowMs: number;

  refresh: () => Promise<void>;
  addBarangay: (slug: string) => void;
  removeBarangay: (slug: string) => void;
  setName: (name: string | null) => void;
  setAlert: (key: keyof Prefs["alerts"], on: boolean) => void;
  completeOnboarding: () => void;
  completeTour: () => void;
  resetTour: () => void;

  /** Tour T2→T4 hand-off: the picker's selection, awaiting map/name confirmation before it is added. */
  tourPending: string[] | null;
  setTourPending: (slugs: string[] | null) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [prefs, setPrefs] = useState<Prefs>(() => store.readPrefs());
  const [outages, setOutages] = useState<Outage[]>(() => store.readFeed()?.outages ?? []);
  const [fetchedAtMs, setFetchedAt] = useState<number>(() => store.readFeed()?.fetched_at_ms ?? 0);
  const [etag, setEtag] = useState<string | null>(() => store.readFeed()?.etag ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshKind, setLastKind] = useState<AppStateValue["lastRefreshKind"]>(null);
  const [nowMs, setNow] = useState(() => Date.now());
  const [tourPending, setTourPending] = useState<string[] | null>(null);

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const persistPrefs = useCallback((next: Prefs) => { setPrefs(next); store.writePrefs(next); }, []);

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const r = await feedSource.fetch(etag, Date.now());
      const at = Date.now();
      if (r.kind === "fresh" && r.outages) {
        setOutages(r.outages);
        setEtag(r.etag ?? null);
        setFetchedAt(at);
        store.writeFeed({ schema_version: 1, fetched_at_ms: at, etag: r.etag ?? null, outages: r.outages });
      } else if (r.kind === "unchanged") {
        setFetchedAt(at);
        const prev = store.readFeed();
        if (prev) store.writeFeed({ ...prev, fetched_at_ms: at });
      }
      // "error": leave last-known-good untouched (FR-18)
      setLastKind(r.kind);
    } catch {
      setLastKind("error");
    } finally {
      setRefreshing(false);
    }
  }, [etag, refreshing]);

  // cold start + foreground-after-an-hour (FR-15). No periodic polling, ever (FR-16).
  const lastActive = useRef(Date.now());
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    const sub = RNAppState.addEventListener("change", (s) => {
      if (s === "active") {
        if (Date.now() - lastActive.current > FOREGROUND_REFRESH_AFTER_MS) void refresh();
        lastActive.current = Date.now();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<AppStateValue>(() => ({
    prefs, outages, fetchedAtMs, refreshing, lastRefreshKind, nowMs, refresh,
    addBarangay: (slug) => { if (!prefs.barangays.includes(slug)) persistPrefs({ ...prefs, barangays: [...prefs.barangays, slug] }); },
    removeBarangay: (slug) => persistPrefs({ ...prefs, barangays: prefs.barangays.filter((b) => b !== slug) }),
    setName: (name) => persistPrefs({ ...prefs, name: name?.trim() ? name.trim() : null }),
    setAlert: (key, on) => persistPrefs({ ...prefs, alerts: { ...prefs.alerts, [key]: on } }),
    completeOnboarding: () => persistPrefs({ ...prefs, onboardingDone: true }),
    completeTour: () => persistPrefs({ ...prefs, tourDone: true }),
    resetTour: () => persistPrefs({ ...prefs, tourDone: false }),
    tourPending,
    setTourPending,
  }), [prefs, outages, fetchedAtMs, refreshing, lastRefreshKind, nowMs, refresh, persistPrefs, tourPending]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppStateProvider");
  return v;
}
