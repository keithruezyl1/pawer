import { useEffect, useRef } from "react";
import { deriveLocalNotifications } from "@pawer/shared";
import { findBarangay, displayName } from "@pawer/registry";
import { useApp } from "./AppState";
import { hasPermission, rebuildLocal } from "../platform/notifications";
import { listenForeground, syncTopics } from "../platform/push";

const areaLabel = (slugs: string[]) =>
  slugs.length === 1 ? displayName(findBarangay(slugs[0]!)!) : `${slugs.length} areas`;

/**
 * Keeps the device's alert state in step with the app:
 *   - FCM topic subscriptions follow the selected barangays (D-5, FR-35)
 *   - the pending local notifications are rebuilt from current data on every change (FR-31)
 *   - foreground pushes are handled while the app is open
 */
export function useNotificationSync(): void {
  const { outages, prefs, fetchedAtMs } = useApp();

  // topics
  const subscribed = useRef<string[] | null>(null);
  useEffect(() => {
    const prev = subscribed.current ?? [];
    syncTopics(prev, prefs.barangays).catch(() => {});
    subscribed.current = [...prefs.barangays];
  }, [prefs.barangays.join("|")]);

  // local schedule — rebuilt, never patched
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!(await hasPermission()) || !alive) return;
      const { newAdvisory: _ignored, ...local } = prefs.alerts;
      const list = deriveLocalNotifications(outages, prefs.barangays, local, Date.now(), areaLabel);
      if (alive) await rebuildLocal(list);
    })().catch(() => {});
    return () => { alive = false; };
  }, [outages, prefs.barangays.join("|"), prefs.alerts.eveningBefore, prefs.alerts.hourBefore, prefs.alerts.restoration, fetchedAtMs]);

  // foreground pushes
  useEffect(() => {
    try { return listenForeground(); } catch { return undefined; }
  }, []);
}
