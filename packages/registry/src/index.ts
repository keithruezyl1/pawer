/**
 * The barangay registry — verified reference data, generated from docs/COVERAGE-GLOSSARY.md
 * by scripts/build-from-glossary.ts. Never edit the JSON by hand; edit the glossary and rebuild.
 */
import type { BarangayEntry, LguEntry, Registry } from "@pawer/shared";
import barangaysJson from "../barangays.json";
import lgusJson from "../lgus.json";

export const barangays: readonly BarangayEntry[] = barangaysJson.barangays as BarangayEntry[];
export const lgus: readonly LguEntry[] = lgusJson.lgus as LguEntry[];
export const registry: Registry = { lgus: [...lgus], barangays: [...barangays] };

const bySlug = new Map(barangays.map((b) => [b.slug, b]));

export function findBarangay(slug: string): BarangayEntry | undefined {
  return bySlug.get(slug);
}

export function barangaysOf(lguSlug: string): BarangayEntry[] {
  return barangays.filter((b) => b.lgu === lguSlug);
}

export function findLgu(slug: string): LguEntry | undefined {
  return lgus.find((l) => l.slug === slug);
}

/** Display form per DG §2.2: bare name when unambiguous, "Name, LGU" when the name is shared across LGUs. */
export function displayName(b: BarangayEntry): string {
  return b.ambiguous_across_lgus ? `${b.display}, ${findLgu(b.lgu)?.display ?? b.lgu}` : b.display;
}
