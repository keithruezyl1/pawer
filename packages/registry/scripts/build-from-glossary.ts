/**
 * Builds barangays.json / lgus.json with the Philippine Standard Geographic Code as the
 * authority (ARCH §5.6 R1), and docs/COVERAGE-GLOSSARY.md as the source of ALIASES —
 * the spellings VECO actually writes and the variants secondary sources use.
 *
 *   psgc/<lgu>.json      canonical names + codes (psgc.gitlab.io mirror of PSA data)
 *   glossary §1, §5      alias tables keyed by slug
 *   glossary §4          per-LGU lists — every name must map to a PSGC entry, or the build fails
 *
 * Also writes verification.md (R7): counts, every PSGC↔glossary name difference, unmatched names.
 * Deterministic and re-runnable. Never edit the JSON by hand.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, "..");
const glossaryPath = resolve(pkg, "../../docs/COVERAGE-GLOSSARY.md");
const psgcDir = resolve(pkg, "psgc");

const PSGC_EDITION = "psgc-2026-09 (psgc.gitlab.io)";

const LGUS = [
  { heading: "Cebu City", slug: "cebu-city", display: "Cebu City", psgc: "072217000", aliases: ["cebu city"] },
  { heading: "Mandaue City", slug: "mandaue-city", display: "Mandaue City", psgc: "072230000", aliases: ["mandaue city", "mandaue"] },
  { heading: "Talisay City", slug: "talisay-city", display: "Talisay City", psgc: "072250000", aliases: ["talisay city", "talisay"] },
  { heading: "City of Naga", slug: "naga", display: "City of Naga", psgc: "072234000", aliases: ["city of naga", "naga city", "naga"] },
  { heading: "Liloan", slug: "liloan", display: "Liloan", psgc: "072227000", aliases: ["liloan"] },
  { heading: "Consolacion", slug: "consolacion", display: "Consolacion", psgc: "072219000", aliases: ["consolacion"] },
  { heading: "Minglanilla", slug: "minglanilla", display: "Minglanilla", psgc: "072232000", aliases: ["minglanilla"] },
  { heading: "San Fernando", slug: "san-fernando", display: "San Fernando", psgc: "072241000", aliases: ["san fernando"] },
] as const;

// ---------------------------------------------------------------------------- helpers

function fold(s: string): string {
  return s.normalize("NFKC").replace(/[‐-―−]/g, "-").replace(/[   ]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function kebab(s: string): string {
  return fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function stripMarkers(s: string): string {
  return s.replace(/\*\*[⚠▲]\*\*/g, "").replace(/\*\*/g, "").trim();
}
function backticked(cell: string): string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]!.trim());
}
/** PSGC writes poblacion barangays as "Name (Pob.)" or "Name Pob."; the display drops the marker. */
function cleanPsgcName(raw: string): string {
  return raw.replace(/\s*\(Pob\.\)\s*$/i, "").replace(/\s+Pob\.$/i, " Poblacion").trim();
}

// ---------------------------------------------------------------------------- PSGC (canonical)

interface PsgcRow { code: string; name: string; oldName?: string | null }
interface Entry {
  slug: string; display: string; lgu: string; aliases: Set<string>;
  psgc: string; psgc_name: string; psgc_old_name: string | null;
}

const entries: Entry[] = [];
const psgcCounts: Record<string, number> = {};
for (const lgu of LGUS) {
  const rows = JSON.parse(readFileSync(resolve(psgcDir, `${lgu.slug}.json`), "utf8")) as PsgcRow[];
  psgcCounts[lgu.slug] = rows.length;
  for (const r of rows) {
    const display = cleanPsgcName(r.name);
    const aliases = new Set<string>();
    if (fold(r.name) !== fold(display)) aliases.add(fold(r.name));
    if (r.oldName) aliases.add(fold(r.oldName));
    entries.push({ slug: `${lgu.slug}.${kebab(display)}`, display, lgu: lgu.slug, aliases, psgc: r.code, psgc_name: r.name, psgc_old_name: r.oldName ?? null });
  }
}

function findEntry(lgu: string, variant: string): Entry | undefined {
  const f = fold(variant);
  return entries.find((e) => e.lgu === lgu && (fold(e.display) === f || e.aliases.has(f) || fold(e.psgc_name) === f));
}
function findBySlug(slug: string): Entry | undefined {
  return entries.find((e) => e.slug === slug);
}

// ---------------------------------------------------------------------------- glossary overlay

const md = readFileSync(glossaryPath, "utf8");
const report: string[] = [];
const problems: string[] = [];

// §4 lists: every glossary name must resolve to a PSGC entry; variants that differ become aliases.
const glossaryCounts: Record<string, number> = {};
const nameDiffs: string[] = [];
for (const lgu of LGUS) {
  const re = new RegExp(`### 4\\.\\d ${lgu.heading} — (\\d+) barangays\\n\\n([^\\n]+)`);
  const m = md.match(re);
  if (!m) { problems.push(`glossary §4 section missing for ${lgu.heading}`); continue; }
  const names = m[2]!.split("·").map(stripMarkers).filter(Boolean);
  glossaryCounts[lgu.slug] = names.length;
  const matched = new Set<string>();
  for (const name of names) {
    const variants = name.split("/").map((v) => v.trim());
    const e = variants.map((v) => findEntry(lgu.slug, v)).find(Boolean);
    if (!e) { problems.push(`${lgu.heading}: glossary name "${name}" matches no PSGC barangay`); continue; }
    matched.add(e.slug);
    for (const v of variants) {
      if (fold(v) !== fold(e.display)) {
        e.aliases.add(fold(v));
        nameDiffs.push(`| \`${e.slug}\` | \`${e.psgc_name}\` | \`${v}\` | alias |`);
      }
    }
  }
  for (const e of entries.filter((x) => x.lgu === lgu.slug && !matched.has(x.slug))) {
    problems.push(`${lgu.heading}: PSGC barangay "${e.psgc_name}" (${e.psgc}) is absent from the glossary`);
  }
}

// §1 and §5: alias tables keyed by slug. Unknown slug = the glossary drifted from PSGC → fail loudly.
function overlayAliasTable(sectionStart: string, sectionEnd: string, slugCol: number, variantCols: number[]) {
  const a = md.indexOf(sectionStart); const b = md.indexOf(sectionEnd);
  if (a < 0 || b < 0) { problems.push(`glossary section not found: ${sectionStart}`); return; }
  for (const line of md.slice(a, b).split("\n")) {
    if (!line.startsWith("| `")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const slug = backticked(cells[slugCol] ?? "")[0];
    if (!slug || !slug.includes(".")) continue; // LGU rows
    const e = findBySlug(slug);
    if (!e) { problems.push(`glossary references slug "${slug}" which does not exist under PSGC`); continue; }
    for (const col of variantCols) for (const v of backticked(cells[col] ?? "")) if (fold(v) !== fold(e.display)) e.aliases.add(fold(v));
  }
}
overlayAliasTable("## 1. Source disagreements", "## 2. Ambiguous names", 0, [1, 2, 3, 4]);
overlayAliasTable("## 5. Aliases observed", "## 6. Counts", 1, [0]);

if (problems.length) {
  console.error("Registry build failed:\n  " + problems.join("\n  "));
  process.exit(1);
}

// ---------------------------------------------------------------------------- derived flags

const byFold = new Map<string, Entry[]>();
for (const e of entries) {
  const k = fold(e.display);
  byFold.set(k, [...(byFold.get(k) ?? []), e]);
}
const ambiguous = new Set<string>();
for (const group of byFold.values()) if (new Set(group.map((e) => e.lgu)).size > 1) group.forEach((e) => ambiguous.add(e.slug));

// alias collision guard: an alias must not equal another same-LGU barangay's display or alias
for (const e of entries) {
  for (const a of e.aliases) {
    const clash = entries.find((o) => o.lgu === e.lgu && o.slug !== e.slug && (fold(o.display) === a || o.aliases.has(a)));
    if (clash) problems.push(`alias "${a}" of ${e.slug} collides with ${clash.slug}`);
  }
}
if (problems.length) { console.error("Registry build failed:\n  " + problems.join("\n  ")); process.exit(1); }

const slugs = entries.map((e) => e.slug);
if (new Set(slugs).size !== slugs.length) { console.error("duplicate slugs"); process.exit(1); }

const out = entries
  .map((e) => ({
    slug: e.slug,
    display: e.display,
    lgu: e.lgu,
    aliases: [...e.aliases].sort(),
    psgc: e.psgc,
    psgc_name: e.psgc_name,
    psgc_old_name: e.psgc_old_name,
    verified_against: PSGC_EDITION,
    ambiguous_across_lgus: ambiguous.has(e.slug),
    same_lgu_substring_of: entries
      .filter((o) => o.lgu === e.lgu && o.slug !== e.slug && fold(o.display).includes(fold(e.display)))
      .map((o) => o.slug)
      .sort(),
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

writeFileSync(resolve(pkg, "barangays.json"), JSON.stringify({ schema_version: 1, generated_from: ["psgc/*.json", "docs/COVERAGE-GLOSSARY.md"], barangays: out }, null, 2) + "\n");
writeFileSync(resolve(pkg, "lgus.json"), JSON.stringify({ schema_version: 1, lgus: LGUS.map(({ slug, display, psgc, aliases }) => ({ slug, display, psgc, aliases: [...aliases] })) }, null, 2) + "\n");

// ---------------------------------------------------------------------------- verification.md (R7)

report.push(`# Registry verification`, ``, `Generated by \`scripts/build-from-glossary.ts\`. Authority: **${PSGC_EDITION}**. Aliases: \`docs/COVERAGE-GLOSSARY.md\` §1, §4, §5.`, ``);
report.push(`## Counts`, ``, `| LGU | PSGC | Glossary §4 |`, `|---|---|---|`);
for (const l of LGUS) report.push(`| ${l.display} | ${psgcCounts[l.slug]} | ${glossaryCounts[l.slug]} |`);
report.push(`| **Total** | **${out.length}** | **${Object.values(glossaryCounts).reduce((a, b) => a + b, 0)}** |`, ``);
report.push(`## PSGC name ↔ glossary variant`, ``, `Where a secondary source or VECO spells a barangay differently from PSGC, the PSGC spelling is the display and the variant is an alias.`, ``, `| Slug | PSGC | Variant | Role |`, `|---|---|---|---|`, ...nameDiffs.sort(), ``);
report.push(`## PSGC poblacion markers and old names`, ``, `| Slug | PSGC name | Old name |`, `|---|---|---|`);
for (const e of entries.filter((x) => x.psgc_name !== x.display || x.psgc_old_name).sort((a, b) => a.slug.localeCompare(b.slug))) {
  report.push(`| \`${e.slug}\` | \`${e.psgc_name}\` | ${e.psgc_old_name ? `\`${e.psgc_old_name}\`` : "—"} |`);
}
report.push(``, `## Result`, ``, `Every glossary name resolved to exactly one PSGC barangay and every PSGC barangay appears in the glossary. **${ambiguous.size}** records share a name across LGUs. No alias collides with another same-LGU name.`, ``);
writeFileSync(resolve(pkg, "verification.md"), report.join("\n"));

console.log(`wrote ${out.length} barangays (PSGC-canonical; ${ambiguous.size} ambiguous across LGUs; ${nameDiffs.length} spelling variants aliased), ${LGUS.length} LGUs, verification.md`);
