/**
 * Local notifications (PRD FR-29–34, DG §8). One channel, default importance, no custom sound
 * or vibration. The pending set is REBUILT from scratch on every call (FR-31) from the pure
 * derivation in @pawer/shared, so rescheduled or withdrawn outages self-correct.
 *
 * Verification item (ARCH §7.4): expo-notifications has historically scheduled with exact alarms
 * on Android 12+. PAWER wants inexact (FR-33). Confirm on device during M4; if exact alarms are
 * unavoidable, either accept SCHEDULE_EXACT_ALARM or replace this file with a small native
 * AlarmManager.setAndAllowWhileIdle scheduler behind the same two functions.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { LocalNotification } from "@pawer/shared";

export const CHANNEL_ID = "scheduled-outages";

let channelReady = false;
export async function ensureChannel(): Promise<void> {
  if (channelReady || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Scheduled outages",
    importance: Notifications.AndroidImportance.DEFAULT,
    enableVibrate: true,
    showBadge: false,
  });
  channelReady = true;
}

export async function hasPermission(): Promise<boolean> {
  const p = await Notifications.getPermissionsAsync();
  return p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** Tour T3 — asked only after a barangay is chosen, so the request has visible purpose. */
export async function requestPermission(): Promise<boolean> {
  await ensureChannel();
  const p = await Notifications.requestPermissionsAsync();
  return p.granted;
}

/** Cancel everything PAWER has pending, then schedule exactly `list`. Idempotent. */
export async function rebuildLocal(list: readonly LocalNotification[]): Promise<void> {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of list) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.key,
      content: { title: n.title, body: n.body, data: { outageId: n.outageId, kind: n.kind }, sound: undefined },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.fireAtMs), channelId: CHANNEL_ID },
    });
  }
}

/** Immediate notification for a "new advisory" push, posted by the device after de-dup (FR-30). */
export async function presentNow(title: string, body: string, data: Record<string, string>): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({ content: { title, body, data }, trigger: null });
}

/** Foreground presentation: show the banner even while the app is open. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
