/**
 * Parse every corpus/*.html and print a one-line-per-outage review table, plus write
 * corpus/<name>.parsed.json for golden review. Run: npx tsx scripts/dump-corpus.ts
 *
 * The review table is how a human verifies the parser against real VECO text before
 * a snapshot is promoted to a golden file (ARCH §14 — corpus growth is a policy).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAdvisory } from "../src/index";

const corpus = resolve(dirname(fileURLToPath(import.meta.url)), "../corpus");

for (const file of readdirSync(corpus).filter((f) => f.endsWith(".html")).sort()) {
  const name = file.replace(/\.html$/, "");
  const html = readFileSync(resolve(corpus, file), "utf8");
  const meta = { postUrl: `https://www.visayanelectric.com/post/corpus-${name}`, publishedAt: "2026-01-01T00:00:00Z" };
  const out = parseAdvisory(html, meta);
  writeFileSync(resolve(corpus, `${name}.parsed.json`), JSON.stringify(out, null, 2) + "\n");

  const n = (s: string) => out.filter((o) => o.parse_status === s).length;
  console.log(`\n=== ${name}: ${out.length} outages · ${n("parsed")} parsed · ${n("partial")} partial · ${n("failed")} failed`);
  for (const o of out) {
    const flag = o.parse_status === "parsed" ? " " : o.parse_status === "partial" ? "P" : "F";
    const brgys = o.barangays.map((b) => b.split(".")[1]).join(", ");
    const unknown = o.unknown_area_tokens.length ? `  ?? ${JSON.stringify(o.unknown_area_tokens)}` : "";
    console.log(`${flag} ${o.start.slice(5, 16)}→${o.end.slice(5, 16)} ${String(o.duration_minutes).padStart(4)}m [${o.lgus.join(",")}] ${brgys}${unknown}`);
  }
}
