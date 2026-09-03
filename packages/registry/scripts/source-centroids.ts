/**
 * Sources a candidate centroid per barangay from OpenStreetMap's Nominatim, politely
 * (1 request/second, identifying User-Agent, one run). Output is centroids.json with EVERY entry
 * marked verified:false — a person must review the rendered maps (rule C3) and flip the flag.
 * A barangay with no verified centroid ships with no map (C4). This script never guesses.
 *
 *   npx tsx scripts/source-centroids.ts            # only fills slugs not already present
 *   npx tsx scripts/source-centroids.ts --refresh  # re-query everything (keeps verified flags)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = resolve(pkg, "centroids.json");
const UA = "PAWER/0.1 (open-source barangay outage alerts, Metro Cebu; one-off centroid lookup)";

interface Barangay { slug: string; display: string; lgu: string; psgc_name?: string; aliases?: string[] }

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
interface Lgu { slug: string; display: string }
interface Centroid {
  slug: string; lat: number; lon: number;
  source: "nominatim"; verified: boolean;
  display_name: string; osm_type: string; fetched_at: string;
}

const barangays = (JSON.parse(readFileSync(resolve(pkg, "barangays.json"), "utf8")) as { barangays: Barangay[] }).barangays;
const lgus = (JSON.parse(readFileSync(resolve(pkg, "lgus.json"), "utf8")) as { lgus: Lgu[] }).lgus;
const lguName = (slug: string) => lgus.find((l) => l.slug === slug)?.display ?? slug;

const existing: Centroid[] = existsSync(outPath) ? (JSON.parse(readFileSync(outPath, "utf8")) as { centroids: Centroid[] }).centroids : [];
const byslug = new Map(existing.map((c) => [c.slug, c]));
const refresh = process.argv.includes("--refresh");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function lookup(b: Barangay): Promise<Centroid | null> {
  // Several phrasings: Nominatim knows "Mandaue" but not always "Mandaue City", "Naga" not "City of Naga".
  const short = lguName(b.lgu).replace(/^City of /, "").replace(/ City$/, "");
  const queries = [
    `Barangay ${b.display}, ${lguName(b.lgu)}, Cebu, Philippines`,
    `${b.display}, ${short}, Cebu, Philippines`,
    `Barangay ${b.display}, ${short}, Philippines`,
  ];
  type Hit = { lat: string; lon: string; display_name: string; osm_type: string; type: string; addresstype?: string };
  let hits: Hit[] = [];
  for (const q of queries) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=ph&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) { console.warn(`  ${b.slug}: HTTP ${res.status}`); await sleep(1100); continue; }
    hits = (await res.json()) as Hit[];
    // must mention the LGU too, so a same-named barangay elsewhere in Cebu is not accepted
    hits = hits.filter((h) => new RegExp(escapeRe(short), "i").test(h.display_name));
    if (hits.length) break;
    await sleep(1100);
  }
  // The result must NAME this barangay (display or alias) as a whole word — Nominatim happily
  // returns "Bo. Luz Barangay Hall" for a Lahug query, and a plausible wrong pin is worse than none (C3/C4).
  const names = [b.display, ...(b.aliases ?? [])].map((n) => n.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  const namesIt = (h: { display_name: string }) => {
    const dn = h.display_name.toLowerCase().replace(/[^a-z0-9]+/g, " ");
    return names.some((n) => new RegExp(`(^| )${escapeRe(n)}( |$)`).test(dn));
  };
  const inCebu = (h: { display_name: string }) => /cebu/i.test(h.display_name);
  const isArea = (h: { type: string; addresstype?: string }) => /(administrative|village|suburb|neighbourhood|quarter|hamlet|locality|city_block|town)/.test(`${h.type} ${h.addresstype ?? ""}`);
  const cand = hits.find((h) => inCebu(h) && namesIt(h) && isArea(h)) ?? hits.find((h) => inCebu(h) && namesIt(h));
  if (!cand) return null;
  return { slug: b.slug, lat: Number(cand.lat), lon: Number(cand.lon), source: "nominatim", verified: false, display_name: cand.display_name, osm_type: cand.osm_type, fetched_at: new Date().toISOString() };
}

const todo = barangays.filter((b) => refresh || !byslug.has(b.slug));
console.log(`looking up ${todo.length} of ${barangays.length} barangays (${existing.length} already present)`);
let found = 0;
for (const [i, b] of todo.entries()) {
  const c = await lookup(b).catch((e) => { console.warn(`  ${b.slug}: ${(e as Error).message}`); return null; });
  if (c) {
    const prev = byslug.get(b.slug);
    byslug.set(b.slug, prev?.verified ? { ...c, verified: true } : c); // never un-verify a reviewed entry
    found++;
  } else {
    console.warn(`  no result: ${b.slug}`);
  }
  if ((i + 1) % 25 === 0) console.log(`  …${i + 1}/${todo.length}`);
  await sleep(1100); // Nominatim usage policy: at most 1 request per second
}

const centroids = [...byslug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(outPath, JSON.stringify({ schema_version: 1, note: "verified:false entries are candidates only — review the rendered map before flipping (rule C3)", centroids }, null, 2) + "\n");
console.log(`wrote ${centroids.length} centroids (${found} new/refreshed, ${centroids.filter((c) => c.verified).length} verified) → ${outPath}`);
