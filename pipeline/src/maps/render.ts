/**
 * Static locator images, pre-rendered at build time so the MapTiler key never ships in the APK
 * (ONBOARDING-AND-TOUR.md §4). One image per VERIFIED centroid; nothing for the rest (C1/C4).
 */

export interface Centroid {
  slug: string;
  lat: number;
  lon: number;
  source: string;
  /** Flipped to true only after a person has looked at the rendered image (C3). */
  verified: boolean;
  display_name?: string;
}

export interface RenderOptions { style?: string; zoom?: number; width?: number; height?: number }

export function mapUrl(c: Centroid, key: string, o: RenderOptions = {}): string {
  const { style = "streets-v2", zoom = 15, width = 640, height = 400 } = o;
  const u = new URL(`https://api.maptiler.com/maps/${style}/static/${c.lon},${c.lat},${zoom}/${width}x${height}.webp`);
  u.searchParams.set("key", key);
  u.searchParams.set("markers", `${c.lon},${c.lat}`);
  return u.toString();
}

export interface RenderPlan {
  render: Array<{ slug: string; file: string; centroid: Centroid }>;
  skipped: Array<{ slug: string; reason: "no-centroid" | "unverified" | "exists" }>;
}

export function planRenders(slugs: readonly string[], centroids: readonly Centroid[], existingFiles: readonly string[]): RenderPlan {
  const by = new Map(centroids.map((c) => [c.slug, c]));
  const have = new Set(existingFiles);
  const plan: RenderPlan = { render: [], skipped: [] };
  for (const slug of slugs) {
    const c = by.get(slug);
    const file = `${slug}.webp`;
    if (!c) plan.skipped.push({ slug, reason: "no-centroid" });
    else if (!c.verified) plan.skipped.push({ slug, reason: "unverified" });
    else if (have.has(file)) plan.skipped.push({ slug, reason: "exists" });
    else plan.render.push({ slug, file, centroid: c });
  }
  return plan;
}
