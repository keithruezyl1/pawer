/** Search key: NFKC, dashes unified, lowercased, whitespace collapsed. Mirrors the registry's folding. */
export function foldKey(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[‐-―−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
