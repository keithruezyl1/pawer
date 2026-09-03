/**
 * On-device storage: one JSON file for the feed cache, one for preferences (ARCH §8.1).
 * No database, no AsyncStorage, no MMKV. expo-file-system's File API (SDK 54+), sync methods —
 * the files are a few KB and reads happen once per launch.
 *
 * The optional display name lives here and nowhere else (PRD NFR-15, BRD BR-6).
 */
import { File, Paths } from "expo-file-system";
import type { Outage } from "@pawer/shared";

export interface FeedCache {
  schema_version: 1;
  fetched_at_ms: number;
  etag: string | null;
  outages: Outage[];
}

export interface Prefs {
  schema_version: 1;
  barangays: string[];
  name: string | null;
  alerts: { newAdvisory: boolean; eveningBefore: boolean; hourBefore: boolean; restoration: boolean };
  onboardingDone: boolean;
  tourDone: boolean;
  /** Outage ids already surfaced as a "new advisory" notification (FR-30 de-dup). */
  notifiedIds: string[];
}

export const DEFAULT_PREFS: Prefs = {
  schema_version: 1,
  barangays: [],
  name: null,
  alerts: { newAdvisory: true, eveningBefore: true, hourBefore: true, restoration: true },
  onboardingDone: false,
  tourDone: false,
  notifiedIds: [],
};

const feedFile = () => new File(Paths.document, "feed.json");
const prefsFile = () => new File(Paths.document, "prefs.json");

function readJson<T>(f: File): T | null {
  try {
    if (!f.exists) return null;
    return JSON.parse(f.textSync()) as T;
  } catch {
    return null; // a corrupt file is treated as absent, never as data (FR-18)
  }
}

function writeJson(f: File, value: unknown): void {
  if (!f.exists) f.create();
  f.write(JSON.stringify(value));
}

export const store = {
  readFeed: (): FeedCache | null => readJson<FeedCache>(feedFile()),
  writeFeed: (cache: FeedCache): void => writeJson(feedFile(), cache),
  readPrefs: (): Prefs => ({ ...DEFAULT_PREFS, ...(readJson<Partial<Prefs>>(prefsFile()) ?? {}) }),
  writePrefs: (prefs: Prefs): void => writeJson(prefsFile(), prefs),
};
