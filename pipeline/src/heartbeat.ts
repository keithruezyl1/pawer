import { manilaDateKey } from "@pawer/shared";

/**
 * GitHub disables scheduled workflows after 60 days without a commit. One heartbeat commit per
 * Manila calendar day guarantees activity regardless of how quiet VECO is (ARCH §4.4, NFR-23).
 */
export function needsHeartbeat(lastRunIso: string | null, nowMs: number): boolean {
  if (!lastRunIso) return true;
  const last = Date.parse(lastRunIso);
  if (Number.isNaN(last)) return true;
  return manilaDateKey(last) !== manilaDateKey(nowMs);
}
