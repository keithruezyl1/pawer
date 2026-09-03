/**
 * "Areas Affected:" → LGUs + barangay slugs (ARCH §5.4). Registry scan, not sentence parse.
 *
 *   0  split head/tail at the first "along" — the tail is streets, sitios, subdivisions; never scanned
 *   1  detect LGUs in the head (longest alias first)
 *   2  candidates = barangays of the detected LGUs
 *   3  tokenise the head on , & ( ) and match each WHOLE token — never a prefix (R11).
 *      A short form matching several same-LGU barangays fans out and flags ambiguity (R12).
 *   4  whatever is left over is an unknown token — reported, never dropped (NFR-22)
 */
import type { Registry } from "@pawer/shared";
import { registry as defaultRegistry } from "@pawer/registry";
import { foldForMatch, normalizeText } from "./normalize";

export interface AreaResolution {
  lgus: string[];
  barangays: string[];
  unknownTokens: string[];
  /** True when a token matched more than one barangay (same-LGU short form or cross-LGU duplicate). */
  ambiguous: boolean;
}

const STOP_TOKENS = new Set(["", "portion", "portions", "portion of", "portions of", "of", "and", "the"]);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Prepared {
  lguAliases: Array<{ slug: string; alias: string; re: RegExp }>;
  byLgu: Map<string, Array<{ slug: string; keys: string[]; fold: string }>>;
}

const cache = new WeakMap<Registry, Prepared>();

function prepare(reg: Registry): Prepared {
  const hit = cache.get(reg);
  if (hit) return hit;
  const lguAliases = reg.lgus
    .flatMap((l) => [l.display, ...l.aliases].map((a) => ({ slug: l.slug, alias: foldForMatch(a) })))
    .filter((x, i, arr) => arr.findIndex((y) => y.slug === x.slug && y.alias === x.alias) === i)
    .sort((a, b) => b.alias.length - a.alias.length)
    // No "g" flag: a global regex keeps lastIndex between .test() calls and these are cached.
    .map((x) => ({ ...x, re: new RegExp(`(?<![a-z0-9])${escapeRe(x.alias)}(?![a-z0-9])`, "i") }));
  const byLgu = new Map<string, Array<{ slug: string; keys: string[]; fold: string }>>();
  for (const b of reg.barangays) {
    const fold = foldForMatch(b.display);
    const keys = [fold, ...b.aliases.map(foldForMatch)];
    if (!byLgu.has(b.lgu)) byLgu.set(b.lgu, []);
    byLgu.get(b.lgu)!.push({ slug: b.slug, keys, fold });
  }
  const prepared = { lguAliases, byLgu };
  cache.set(reg, prepared);
  return prepared;
}

export function splitHeadTail(text: string): { head: string; tail: string } {
  const m = /\balong\b/i.exec(text);
  if (!m) return { head: text, tail: "" };
  return { head: text.slice(0, m.index), tail: text.slice(m.index + m[0].length) };
}

export function resolveAreas(areasText: string, reg: Registry = defaultRegistry): AreaResolution {
  const { lguAliases, byLgu } = prepare(reg);
  const { head: rawHead } = splitHeadTail(normalizeText(areasText));

  // 1. LGUs — match on the folded head, remove matched spans from a parallel display-cased copy.
  let head = rawHead;
  const lgus: string[] = [];
  for (const { slug, re } of lguAliases) {
    if (!re.test(foldForMatch(head))) continue;
    if (!lgus.includes(slug)) lgus.push(slug);
    head = head.replace(new RegExp(re.source, "gi"), " ");
  }

  // 3. tokens
  const tokens = head
    .replace(/\bportions?\s+o[fd]\b/gi, " ") // "od" is a real VECO typo for "of"
    .split(/[,&()]|\band\b/i)
    .map((t) => t.replace(/^[\s.;:]+|[\s.;:]+$/g, ""))
    .filter((t) => !STOP_TOKENS.has(t.toLowerCase()));

  const candidates = lgus.flatMap((l) => byLgu.get(l) ?? []);
  const barangays: string[] = [];
  const unknownTokens: string[] = [];
  let ambiguous = false;
  const add = (slug: string) => { if (!barangays.includes(slug)) barangays.push(slug); };

  for (const token of tokens) {
    if (lgus.length === 0) { unknownTokens.push(token); continue; }
    const key = foldForMatch(token);
    if (!key) continue;

    const exact = candidates.filter((c) => c.keys.includes(key));
    if (exact.length > 0) {
      exact.forEach((c) => add(c.slug));
      if (exact.length > 1) ambiguous = true; // same name in two detected LGUs (e.g. Cadulawan)
      continue;
    }

    // Same-LGU short form: "Basak" → "Basak Pardo", "Basak San Nicolas". Whole-word prefix only,
    // so "Lawaan I" never reaches "Lawaan II".
    const fanOut = candidates.filter((c) => c.fold.startsWith(`${key} `));
    if (fanOut.length > 0) {
      fanOut.forEach((c) => add(c.slug));
      ambiguous = true;
      continue;
    }

    // Loose fallback: the token STARTS WITH a known name followed by a separator
    // ("Lorega-San Miguel" before its alias existed). Resolve it so nobody misses an alert,
    // but still report the token so the alias gets added (NFR-22). Longest key wins.
    const loose = candidates
      .flatMap((c) => c.keys.map((k) => ({ c, k })))
      .filter(({ k }) => key.startsWith(k) && /^[^a-z0-9]/.test(key.slice(k.length)))
      .sort((x, y) => y.k.length - x.k.length);
    if (loose.length > 0) {
      add(loose[0]!.c.slug);
      unknownTokens.push(token);
      continue;
    }

    unknownTokens.push(token);
  }

  return { lgus, barangays, unknownTokens, ambiguous };
}
