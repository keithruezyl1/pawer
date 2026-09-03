/**
 * Renders barangay locator images from MapTiler raster tiles. Needs MAPTILER_KEY.
 *
 *   tsx src/maps/cli.ts            publish mode: VERIFIED centroids only -> assets/maps/  (committed, served)
 *   tsx src/maps/cli.ts --review   review mode:  every candidate -> review/maps/ + index.html contact sheet
 *                                  (uploaded as a workflow artifact for a person to check, rule C3)
 *
 * Every request carries MAPS_UA; the key is restricted to that substring.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { barangays } from "@pawer/registry";
import { compositeImage, planRenders, tileLayout, tileUrl, VIEW, type Centroid } from "./render";
import { MAPS_UA } from "./ua";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const review = process.argv.includes("--review");
const centroidsPath = resolve(ROOT, "packages/registry/centroids.json");
const outDir = resolve(ROOT, review ? "review/maps" : "assets/maps");

const centroids: Centroid[] = existsSync(centroidsPath)
  ? (JSON.parse(readFileSync(centroidsPath, "utf8")) as { centroids: Centroid[] }).centroids
  : [];

if (review) rmSync(outDir, { recursive: true, force: true }); // a review set is always fresh
mkdirSync(outDir, { recursive: true });

const plan = planRenders(barangays.map((b) => b.slug), centroids, review ? [] : readdirSync(outDir), { includeUnverified: review });
const counts = plan.skipped.reduce<Record<string, number>>((a, s) => ((a[s.reason] = (a[s.reason] ?? 0) + 1), a), {});
console.log(`[maps] ${review ? "REVIEW" : "PUBLISH"} mode, ${plan.render.length} to render, skipped ${JSON.stringify(counts)}`);
if (plan.render.length === 0) process.exit(0);

const key = process.env.MAPTILER_KEY;
if (!key) { console.error("[maps] MAPTILER_KEY is not set and there are images to render"); process.exit(1); }

const tileCache = new Map<string, Buffer>();
async function fetchTile(z: number, x: number, y: number): Promise<Buffer | null> {
  const k = `${z}/${x}/${y}`;
  const hit = tileCache.get(k);
  if (hit) return hit;
  const res = await fetch(tileUrl({ z, x, y }, key!), { headers: { "User-Agent": MAPS_UA } });
  if (!res.ok) { console.error(`[maps] tile ${k}: HTTP ${res.status}`); return null; }
  const buf = Buffer.from(await res.arrayBuffer());
  tileCache.set(k, buf);
  return buf;
}

let ok = 0;
let placements = 0;
const rendered: Array<{ slug: string; file: string; centroid: Centroid }> = [];
for (const r of plan.render) {
  const layout = tileLayout(r.centroid.lon, r.centroid.lat, VIEW.zoom, VIEW.width, VIEW.height);
  const bufs = await Promise.all(layout.tiles.map((t) => fetchTile(t.z, t.x, t.y)));
  placements += layout.tiles.length;
  const tiles = new Map<string, Buffer>();
  layout.tiles.forEach((t, i) => { if (bufs[i]) tiles.set(`${t.z}/${t.x}/${t.y}`, bufs[i]!); });
  if (tiles.size === 0) { console.error(`[maps] ${r.slug}: no tiles`); continue; }
  writeFileSync(resolve(outDir, r.file), await compositeImage(layout, tiles));
  rendered.push(r);
  ok++;
  await new Promise((t) => setTimeout(t, 120));
}

if (review) {
  const rows = rendered.map((r) => `
    <figure class="${r.centroid.verified ? "v" : ""}">
      <img src="${r.file}" alt="${r.slug}" loading="lazy">
      <figcaption><b>${r.slug}</b>${r.centroid.verified ? " (verified)" : ""}<br><small>${r.centroid.display_name ?? ""}</small><br><code>${r.centroid.lat.toFixed(5)}, ${r.centroid.lon.toFixed(5)}</code></figcaption>
    </figure>`).join("");
  writeFileSync(resolve(outDir, "index.html"), `<!doctype html><meta charset="utf-8"><title>PAWER map review</title>
<style>body{font:14px system-ui;background:#F5F5F5;color:#212431;margin:20px}figure{display:inline-block;width:320px;margin:8px;vertical-align:top;border:2px solid #212431;background:#fff}figure.v{border-color:#9BF06B}img{width:320px;height:200px;display:block}figcaption{padding:8px}code{font-size:11px}</style>
<h1>PAWER barangay locator review: ${rendered.length} candidates</h1>
<p>For each image, is the pin inside that barangay? If yes, set <code>"verified": true</code> for its slug in <code>packages/registry/centroids.json</code>. If not, fix lat/lon or leave it unverified and no map ships for it (rule C3).</p>
${rows}`);
}

console.log(`[maps] rendered ${ok}/${plan.render.length}, ${placements} tile placements, ${tileCache.size} unique tiles fetched`);
if (ok !== plan.render.length) process.exit(1);
