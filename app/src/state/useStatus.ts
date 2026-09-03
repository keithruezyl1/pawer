import { useMemo } from "react";
import { resolveStatus, type StatusResult } from "@pawer/shared";
import { useApp } from "./AppState";

/** The dashboard hero and the (future) widget blob both come from this single resolution. */
export function useStatus(): StatusResult {
  const { outages, prefs, nowMs, fetchedAtMs } = useApp();
  // Recompute on the minute, not the second — the countdown text reads nowMs directly.
  const minute = Math.floor(nowMs / 60000);
  return useMemo(
    () => resolveStatus(outages, prefs.barangays, minute * 60000, fetchedAtMs),
    [outages, prefs.barangays, minute, fetchedAtMs],
  );
}
