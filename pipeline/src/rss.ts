/** VECO's Wix RSS 2.0 feed → items. Regex over <item> blocks: the feed is small and flat, and a
 *  full XML parser would be the pipeline's only non-trivial dependency. */

export interface FeedItem {
  title: string;
  link: string;
  /** ISO 8601 UTC. */
  publishedAt: string;
}

const ITEM_RE = /<item>([\s\S]*?)<\/item>/g;

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? unwrap(m[1]!) : null;
}

function unwrap(s: string): string {
  return s
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .trim();
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  for (const m of xml.matchAll(ITEM_RE)) {
    const block = m[1]!;
    const title = tag(block, "title");
    const link = tag(block, "link");
    const pub = tag(block, "pubDate");
    if (!title || !link) continue;
    const ms = pub ? Date.parse(pub) : NaN;
    items.push({ title, link, publishedAt: Number.isNaN(ms) ? new Date(0).toISOString() : new Date(ms).toISOString() });
  }
  return items;
}

/** The filter that drops bidding notices, HR posts, and rate announcements (ARCH §2.1). */
export function selectAdvisories(items: readonly FeedItem[]): FeedItem[] {
  return items.filter((i) => /^service interruption:/i.test(i.title.trim()));
}
