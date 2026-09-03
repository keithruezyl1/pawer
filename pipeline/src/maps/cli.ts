/**
 * Renders missing barangay locator images into assets/maps/. Needs MAPTILER_KEY.
 * Every request carries this exact User-Agent; the MapTiler key is restricted to the substring
 * "PAWER-maps", so the key is worthless to anyone who does not also spoof the header.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { barangays } from "@pawer/registry";
import { mapUrl, planRenders, type Centroid } from "./render";

export const MAPS_UA = "PAWER-maps/0.1 (+https://github.com/keithruezyl1/pawer; build-time static renders only)";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const centroidsPath = resolve(ROOT, "packages/registry/centroids.json");
const outDir = resolve(ROOT, "assets/maps");

const centroids: Centroid[] = existsSync(centroidsPath) ? (JSON.parse(readFileSync(centroidsPath, "utf8")) as { centroids: Centroid[] }).centroids : [];
mkdirSync(outDir, { recursive: true });
const plan = planRenders(barangays.map((b) => b.slug), centroids, readdirSync(outDir));

const counts = plan.skipped.reduce<Record<string, number>>((a, s) => ((a[s.reason] = (a[s.reason] ?? 0) + 1), a), {});
console.log(`[maps] ${plan.render.length} to render · skipped: ${JSON.stringify(counts)}`);
if (plan.render.length === 0) process.exit(0);

const key = process.env.MAPTILER_KEY;
if (!key) { console.error("[maps] MAPTILER_KEY is not set and there are images to render"); process.exit(1); }

let ok = 0;
for (const r of plan.render) {
  const res = await fetch(mapUrl(r.centroid, key), { headers: { "User-Agent": MAPS_UA } });
  if (!res.ok) { console.error(`[maps] ${r.slug}: HTTP ${res.status}`); continue; }
  writeFileSync(resolve(outDir, r.file), Buffer.from(await res.arrayBuffer()));
  ok++;
  await new Promise((t) => setTimeout(t, 150));
}
console.log(`[maps] rendered ${ok}/${plan.render.length}`);
if (ok !== plan.render.length) process.exit(1);
