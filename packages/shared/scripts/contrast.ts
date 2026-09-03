/**
 * WCAG 2.x contrast ratios for the DESIGN-GUIDELINES v2 palette (§4.4).
 * This script is the authority; the table in the doc is a copy of its output.
 * Exits non-zero if any pair marked "body" falls below 4.5:1 or any "large" pair below 3:1.
 */
import { tokens } from "../src/palette";

function srgbToLin(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * srgbToLin(r!) + 0.7152 * srgbToLin(g!) + 0.0722 * srgbToLin(b!);
}
export function contrast(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)];
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

type Req = "body" | "large";
const pairs: Array<[label: string, fg: string, bg: string, req: Req]> = [
  ["ink on ground", tokens.ink, tokens.ground, "body"],
  ["ink on surface-2", tokens.ink, tokens.surface2, "body"],
  ["slate on ground", tokens.slate, tokens.ground, "body"],
  ["ink on status.clear", tokens.ink, tokens.status.clear, "body"],
  ["ink on status.upcoming", tokens.ink, tokens.status.upcoming, "body"],
  ["ink on status.ongoing", tokens.ink, tokens.status.ongoing, "body"],
  ["ink on status.ended", tokens.ink, tokens.status.ended, "body"],
  ["ink on accent", tokens.ink, tokens.accent, "large"],
  ["ground on accent", tokens.ground, tokens.accent, "large"],
];

let failed = false;
console.log("pair".padEnd(26), "ratio".padStart(7), "  requirement");
for (const [label, fg, bg, req] of pairs) {
  const r = contrast(fg, bg);
  const min = req === "body" ? 4.5 : 3;
  const ok = r >= min;
  if (!ok) failed = true;
  console.log(label.padEnd(26), r.toFixed(2).padStart(7), `  ${req} ≥ ${min}  ${ok ? "OK" : "FAIL"}`);
}
if (failed) {
  console.error("\nContrast check failed.");
  process.exit(1);
}
