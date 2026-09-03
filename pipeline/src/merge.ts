import { DAY_MS, type Outage } from "@pawer/shared";

const RETAIN_DAYS = 30;

/** A post is the unit of truth: re-parsing it replaces every outage it previously produced. */
export function mergeOutages(existing: readonly Outage[], incoming: readonly Outage[], nowMs: number): Outage[] {
  const reparsed = new Set(incoming.map((o) => o.source_post_url));
  const cutoff = nowMs - RETAIN_DAYS * DAY_MS;
  return [...existing.filter((o) => !reparsed.has(o.source_post_url)), ...incoming]
    .filter((o) => Date.parse(o.end) >= cutoff)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

/** Future, resolvable to at least one barangay, not yet pushed. Partial entries notify (§5.5). */
export function selectToNotify(outages: readonly Outage[], notified: readonly string[], nowMs: number): Outage[] {
  const done = new Set(notified);
  return outages.filter(
    (o) => o.parse_status !== "failed" && o.barangays.length > 0 && !done.has(o.id) && Date.parse(o.start) > nowMs,
  );
}

/** veco.v1.{lgu}.{barangay} — barangay level only; no LGU topic exists (D-17). */
export function topicsFor(o: Outage): string[] {
  return o.barangays.map((slug) => `veco.v1.${slug}`);
}
