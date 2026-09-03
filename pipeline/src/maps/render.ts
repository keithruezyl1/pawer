/**
 * Barangay locator images, composited by us from MapTiler RASTER TILES (free plan) rather than
 * bought from the Static Maps API (paid) — BRD D-26. One 640x400 WebP per barangay, drawn once at
 * build time, so the key never ships and the app only ever fetches a finished image.
 *
 * Pure parts (tested): Web Mercator maths, tile layout, URL, render planning.
 * The I/O part (compositeImage) takes tile buffers in and returns one WebP buffer out.
 */
import sharp from "sharp";

export interface Centroid {
  slug: string;
  lat: number;
  lon: number;
  source: string;
  /** Flipped to true only after a person has looked at the rendered image (C3). */
  verified: boolean;
  display_name?: string;
}

export const TILE = 256;
export const STYLE = "streets-v2";
export const VIEW = { width: 640, height: 400, zoom: 15 } as const;
/** MapTiler's terms require this on every map image. */
export const ATTRIBUTION = "© MapTiler © OpenStreetMap contributors";

// ------------------------------------------------------------------ Web Mercator

export function lonLatToWorldPx(lon: number, lat: number, z: number): { x: number; y: number } {
  const world = TILE * 2 ** z;
  const x = ((lon + 180) / 360) * world;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * world;
  return { x, y };
}

export interface TileRef { z: number; x: number; y: number }
export interface PlacedTile extends TileRef { dx: number; dy: number }
export interface Layout { tiles: PlacedTile[]; center: { x: number; y: number }; width: number; height: number }

/** Which tiles cover a width×height view centred on lon/lat, and where each pastes on the canvas. */
export function tileLayout(lon: number, lat: number, z: number, width: number, height: number): Layout {
  const c = lonLatToWorldPx(lon, lat, z);
  const left = c.x - width / 2;
  const top = c.y - height / 2;
  const tx0 = Math.floor(left / TILE), tx1 = Math.floor((left + width - 1) / TILE);
  const ty0 = Math.floor(top / TILE), ty1 = Math.floor((top + height - 1) / TILE);
  const tiles: PlacedTile[] = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    tiles.push({ z, x: tx, y: ty, dx: tx * TILE - left, dy: ty * TILE - top });
  }
  return { tiles, center: { x: width / 2, y: height / 2 }, width, height };
}

export function tileUrl(t: TileRef, key: string, style = STYLE): string {
  const u = new URL(`https://api.maptiler.com/maps/${style}/${TILE}/${t.z}/${t.x}/${t.y}.png`);
  u.searchParams.set("key", key);
  return u.toString();
}

// ------------------------------------------------------------------ planning

export interface RenderPlan {
  render: Array<{ slug: string; file: string; centroid: Centroid }>;
  skipped: Array<{ slug: string; reason: "no-centroid" | "unverified" | "exists" }>;
}

export function planRenders(
  slugs: readonly string[],
  centroids: readonly Centroid[],
  existingFiles: readonly string[],
  opts: { includeUnverified: boolean },
): RenderPlan {
  const by = new Map(centroids.map((c) => [c.slug, c]));
  const have = new Set(existingFiles);
  const plan: RenderPlan = { render: [], skipped: [] };
  for (const slug of slugs) {
    const c = by.get(slug);
    const file = `${slug}.webp`;
    if (!c) plan.skipped.push({ slug, reason: "no-centroid" });
    else if (!c.verified && !opts.includeUnverified) plan.skipped.push({ slug, reason: "unverified" });
    else if (have.has(file)) plan.skipped.push({ slug, reason: "exists" });
    else plan.render.push({ slug, file, centroid: c });
  }
  return plan;
}

// ------------------------------------------------------------------ compositing

/** Neobrutalist pin: ink-outlined accent disc with a stem, centred on the centroid (DG v2 palette). */
export function pinSvg(cx: number, cy: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW.width}" height="${VIEW.height}">
  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 22}" stroke="#212431" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy - 26}" r="10" fill="#EA5C1F" stroke="#212431" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="3" fill="#212431"/>
</svg>`;
}

export function attributionSvg(): string {
  const w = 236, h = 18;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW.width}" height="${VIEW.height}">
  <rect x="${VIEW.width - w - 4}" y="${VIEW.height - h - 4}" width="${w}" height="${h}" fill="#F5F5F5" fill-opacity="0.88"/>
  <text x="${VIEW.width - 8}" y="${VIEW.height - 9}" text-anchor="end" font-family="Roboto, Arial, sans-serif" font-size="11" fill="#212431">${ATTRIBUTION}</text>
</svg>`;
}

/**
 * Paste the fetched tiles onto a 640x400 canvas, overlay the pin and attribution, encode WebP.
 * Tiles that straddle the canvas edge are cropped to the visible part first — sharp's composite
 * offsets must be non-negative.
 */
export async function compositeImage(layout: Layout, tiles: ReadonlyMap<string, Buffer>): Promise<Buffer> {
  const overlays: sharp.OverlayOptions[] = [];
  for (const t of layout.tiles) {
    const buf = tiles.get(`${t.z}/${t.x}/${t.y}`);
    if (!buf) continue;
    const left = Math.round(t.dx), top = Math.round(t.dy);
    const cropL = Math.max(0, -left), cropT = Math.max(0, -top);
    const w = Math.min(TILE - cropL, layout.width - Math.max(0, left));
    const h = Math.min(TILE - cropT, layout.height - Math.max(0, top));
    if (w <= 0 || h <= 0) continue;
    const piece = await sharp(buf).extract({ left: cropL, top: cropT, width: w, height: h }).png().toBuffer();
    overlays.push({ input: piece, left: Math.max(0, left), top: Math.max(0, top) });
  }
  overlays.push({ input: Buffer.from(pinSvg(layout.center.x, layout.center.y)), left: 0, top: 0 });
  overlays.push({ input: Buffer.from(attributionSvg()), left: 0, top: 0 });
  return sharp({ create: { width: layout.width, height: layout.height, channels: 3, background: "#E9E9E7" } })
    .composite(overlays)
    .webp({ quality: 80 })
    .toBuffer();
}
