/**
 * FCM topics (ARCH §7.2–7.3). The device subscribes itself to `veco.v1.{lgu}.{barangay}` — no
 * token ever reaches PAWER's infrastructure. Messages are data-only; this file de-duplicates by
 * outage id and posts ONE local notification, however many of the user's topics matched (FR-30).
 *
 * The background handler runs without React: it reads/writes the same JSON files the app uses.
 */
import {
  getMessaging,
  onMessage,
  setBackgroundMessageHandler,
  subscribeToTopic,
  unsubscribeFromTopic,
  type RemoteMessage,
} from "@react-native-firebase/messaging";
import { formatDateShort, formatDuration, formatWindow, type Outage } from "@pawer/shared";
import { findBarangay, displayName } from "@pawer/registry";
import { feedSource } from "../data/feed";
import { store } from "../data/store";
import { presentNow } from "./notifications";

export const topicFor = (slug: string) => `veco.v1.${slug}`;

/** Bring subscriptions in line with the selection. Unsubscribe first so a removed area goes quiet immediately. */
export async function syncTopics(previous: readonly string[], next: readonly string[]): Promise<void> {
  const prev = new Set(previous);
  const want = new Set(next);
  const m = getMessaging();
  for (const slug of prev) if (!want.has(slug)) await unsubscribeFromTopic(m, topicFor(slug)).catch(() => {});
  for (const slug of want) if (!prev.has(slug)) await subscribeToTopic(m, topicFor(slug)).catch(() => {});
}

function areaLabel(slugs: string[]): string {
  return slugs.length === 1 ? displayName(findBarangay(slugs[0]!)!) : `${slugs.length} areas`;
}

/**
 * Handle one data message. Refreshes the feed (the message carries ids, not content, so the
 * notification text is always composed from current data), then notifies once per NEW outage
 * affecting a selected barangay. Safe to call from foreground or headless.
 */
export async function handleDataMessage(msg: RemoteMessage): Promise<void> {
  if (msg.data?.type !== "new_advisory") return;
  const ids = String(msg.data.outage_ids ?? "").split(",").filter(Boolean);
  if (ids.length === 0) return;

  const prefs = store.readPrefs();
  if (!prefs.alerts.newAdvisory || prefs.barangays.length === 0) return;
  const fresh = new Set(ids.filter((id) => !prefs.notifiedIds.includes(id)));
  if (fresh.size === 0) return;

  // Pull current data so copy comes from the parsed record, not the push payload.
  let outages: Outage[] = store.readFeed()?.outages ?? [];
  try {
    const r = await feedSource.fetch(store.readFeed()?.etag ?? null, Date.now());
    if (r.kind === "fresh" && r.outages) {
      outages = r.outages;
      store.writeFeed({ schema_version: 1, fetched_at_ms: Date.now(), etag: r.etag ?? null, outages });
    }
  } catch { /* last-known-good is fine (FR-18) */ }

  const selected = new Set(prefs.barangays);
  const now = Date.now();
  const toNotify = outages.filter((o) => fresh.has(o.id) && o.barangays.some((b) => selected.has(b)) && Date.parse(o.start) > now);

  for (const o of toNotify) {
    const mine = o.barangays.filter((b) => selected.has(b));
    const start = Date.parse(o.start), end = Date.parse(o.end);
    await presentNow(
      `New outage scheduled — ${areaLabel(mine)}`,
      `${formatDateShort(start, now)} · ${formatWindow(start, end)} (${formatDuration(o.duration_minutes)})`,
      { outageId: o.id, kind: "newAdvisory" },
    );
  }
  if (toNotify.length) store.writePrefs({ ...prefs, notifiedIds: [...prefs.notifiedIds, ...toNotify.map((o) => o.id)].slice(-500) });
}

/** Register the headless handler. Must run at module load, before any React render. */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(), handleDataMessage);
}

/** Foreground delivery while the app is open. Returns an unsubscribe. */
export function listenForeground(): () => void {
  return onMessage(getMessaging(), handleDataMessage);
}
