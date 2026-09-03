import { DAY_MS, type Outage } from "@pawer/shared";

/** slug → ISO start of the most recent advisory naming it. */
export type Coverage = Record<string, string>;

type Seen = Pick<Outage, "barangays" | "start" | "parse_status">;

export function updateCoverage(coverage: Coverage, outages: readonly Seen[]): Coverage {
  const next: Coverage = { ...coverage };
  for (const o of outages) {
    if (o.parse_status === "failed") continue;
    for (const b of o.barangays) {
      const prev = next[b];
      if (!prev || Date.parse(o.start) > Date.parse(prev)) next[b] = o.start;
    }
  }
  return next;
}

/**
 * R9 — the only false-negative detector. A registry barangay absent from every advisory for
 * `weeks` is either genuinely unserved or an alias mismatch silently failing to match.
 */
export function staleBarangays(coverage: Coverage, slugs: readonly string[], nowMs: number, weeks = 12): string[] {
  const cutoff = nowMs - weeks * 7 * DAY_MS;
  return slugs.filter((s) => {
    const last = coverage[s];
    return !last || Date.parse(last) < cutoff;
  });
}
