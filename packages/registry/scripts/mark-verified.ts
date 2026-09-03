/**
 * Flip centroids to verified after a person has looked at the rendered pins (rule C3).
 *
 *   npx tsx scripts/mark-verified.ts cebu-city.lahug naga.colon      # these slugs → verified
 *   npx tsx scripts/mark-verified.ts --unverify liloan.tabla          # back to unverified
 *   npx tsx scripts/mark-verified.ts --all                            # every candidate → verified
 *   npx tsx scripts/mark-verified.ts --lgu cebu-city                  # every candidate in one LGU
 *
 * Commit the resulting centroids.json; the maps workflow renders and publishes the verified set.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(pkg, "centroids.json");
const file = JSON.parse(readFileSync(path, "utf8")) as { centroids: Array<{ slug: string; verified: boolean }> };

const args = process.argv.slice(2);
const unverify = args.includes("--unverify");
const all = args.includes("--all");
const lguIdx = args.indexOf("--lgu");
const lgu = lguIdx >= 0 ? args[lguIdx + 1] : null;
const slugs = new Set(args.filter((a) => !a.startsWith("--") && a !== lgu));

let changed = 0;
for (const c of file.centroids) {
  const match = all || slugs.has(c.slug) || (lgu !== null && c.slug.startsWith(`${lgu}.`));
  if (!match) continue;
  const next = !unverify;
  if (c.verified !== next) { c.verified = next; changed++; }
}
for (const s of slugs) if (!file.centroids.some((c) => c.slug === s)) console.warn(`no centroid for ${s} (it has no candidate — nothing to verify)`);

writeFileSync(path, JSON.stringify(file, null, 2) + "\n");
const v = file.centroids.filter((c) => c.verified).length;
console.log(`${changed} changed; ${v}/${file.centroids.length} verified`);
