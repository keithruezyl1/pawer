import { useEffect } from "react";
import { deriveWidgetState, resolveStatus } from "@pawer/shared";
import { findBarangay, displayName } from "@pawer/registry";
import { widget } from "../platform/widget";
import { useApp } from "./AppState";

const areaLabel = (slugs: string[]) =>
  slugs.length === 1 ? displayName(findBarangay(slugs[0]!)!) : `${slugs.length} areas`;

/**
 * Keeps the widget's precomputed blob in step with the app (ARCH §9.2). Recomputed when the
 * data, the selection, or the Manila minute changes — the same resolveStatus as the hero, so the
 * two surfaces are structurally incapable of disagreeing.
 */
export function useWidgetSync(): void {
  const { outages, prefs, fetchedAtMs, nowMs } = useApp();
  const minute = Math.floor(nowMs / 60000);
  useEffect(() => {
    if (!widget.available) return;
    if (prefs.barangays.length === 0) { widget.clear(); return; }
    const now = minute * 60000;
    const status = resolveStatus(outages, prefs.barangays, now, fetchedAtMs);
    widget.setState(deriveWidgetState(status, prefs.barangays, now, fetchedAtMs, areaLabel));
  }, [outages, prefs.barangays, fetchedAtMs, minute]);
}
