/**
 * HTML → ordered text lines. One line per block element, document order, whitespace collapsed,
 * NO Unicode normalisation (that is normalizeText's job, and tests rely on raw U+2011 surviving).
 *
 * VECO's site is Wix; the advisory body is a Ricos rich-content table with labels in column 0
 * and values in column 1, and day headers as paragraphs between tables. Taking every <p>/<h*>/<li>
 * inside the post body yields exactly the label/value/header sequence, and stays correct if the
 * layout ever changes from tables to plain paragraphs.
 */
import { parse, type HTMLElement } from "node-html-parser";

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li";

function pickRoot(doc: HTMLElement): HTMLElement {
  return (
    doc.querySelector('[data-hook="post-description"]') ??
    doc.querySelector("main") ??
    doc.querySelector("body") ??
    doc
  );
}

export function extractLines(html: string): string[] {
  const doc = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  const root = pickRoot(doc);
  const blocks = root.querySelectorAll(BLOCK_SELECTOR);
  const lines: string[] = [];
  for (const el of blocks) {
    // Skip a block that itself contains block children — its text would duplicate theirs.
    if (el.querySelector(BLOCK_SELECTOR)) continue;
    const text = el.text.replace(/\s+/g, " ").trim();
    if (text) lines.push(text);
  }
  return lines;
}
