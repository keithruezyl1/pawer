/**
 * Two layers, deliberately separate (ARCH §5.1):
 *
 *  - normalizeText: lossless-ish cleanup for text we STORE and DISPLAY. Fixes encoding-level
 *    defects (odd hyphens/spaces, doubled commas, zero-width junk) but never rewrites words —
 *    VECO's text is quoted, typos and abbreviations included (DG §6.3).
 *
 *  - foldForMatch: the matching key. Adds honorific expansion (Sta. → Santa), Brgy. stripping
 *    and casefolding. Used only to compare against the registry; never shown to anyone.
 */

const DASHES = /[‐-―−]/g; // ‐ ‑ ‒ – — ― −
const ODD_SPACES = /[   ]/g; // nbsp, figure space, narrow nbsp
const ZERO_WIDTH = /[​‌‍﻿]/g;

/** Emoji and dingbats VECO decorates its Facebook posts with. Never present in website HTML. */
const PICTOGRAPHS = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;

export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(ZERO_WIDTH, "")
    // VECO's Facebook posts lead every line with a pin, a clock or a status dot. They mean
    // something to a reader and nothing to the matcher, and left in they glue themselves to the
    // first name in the list.
    .replace(PICTOGRAPHS, " ")
    .replace(DASHES, "-")
    .replace(ODD_SPACES, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",") // "Casuntingan , Maguikay"
    .replace(/,(?:\s*,)+/g, ",") // "Camputhaw,, Lahug"
    .trim();
}

export function foldForMatch(input: string): string {
  return normalizeText(input)
    .replace(/\bSta\.\s*/gi, "Santa ")
    .replace(/\bSto\.\s*/gi, "Santo ")
    .replace(/\bBrgy\.?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
