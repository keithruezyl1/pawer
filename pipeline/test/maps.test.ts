import { describe, expect, test } from "vitest";
import { lonLatToWorldPx, planRenders, tileLayout, tileUrl, type Centroid } from "../src/maps/render";

const centroids: Centroid[] = [
  { slug: "cebu-city.lahug", lat: 10.3322, lon: 123.8996, source: "nominatim", verified: true },
  { slug: "naga.colon", lat: 10.2183, lon: 123.7581, source: "nominatim", verified: true },
  { slug: "liloan.tabla", lat: 10.4, lon: 123.99, source: "nominatim", verified: false },
];

describe("Web Mercator pixel maths", () => {
  test("the origin and antimeridian land where the projection says", () => {
    const z = 0; // one 256px tile covers the world
    expect(lonLatToWorldPx(0, 0, z)).toEqual({ x: 128, y: 128 });
    expect(lonLatToWorldPx(-180, 0, z).x).toBeCloseTo(0, 6);
    expect(lonLatToWorldPx(180, 0, z).x).toBeCloseTo(256, 6);
  });

  test("Cebu at z15 is inside the world and north of the equator's row", () => {
    const p = lonLatToWorldPx(123.8996, 10.3322, 15);
    const world = 256 * 2 ** 15;
    expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(world);
    expect(p.y).toBeLessThan(world / 2); // northern hemisphere → upper half
  });
});

describe("tileLayout — which tiles to fetch and where to paste them for a 640x400 view", () => {
  const L = tileLayout(123.8996, 10.3322, 15, 640, 400);

  test("covers the viewport: 3 or 4 columns by 2 or 3 rows of 256px tiles", () => {
    const cols = new Set(L.tiles.map((t) => t.x)).size;
    const rows = new Set(L.tiles.map((t) => t.y)).size;
    expect([3, 4]).toContain(cols);
    expect([2, 3]).toContain(rows);
    expect(L.tiles.length).toBe(cols * rows);
  });

  test("every tile has a paste offset that lies within or straddles the canvas", () => {
    for (const t of L.tiles) {
      expect(t.dx).toBeGreaterThan(-256); expect(t.dx).toBeLessThan(640);
      expect(t.dy).toBeGreaterThan(-256); expect(t.dy).toBeLessThan(400);
    }
  });

  test("the centroid maps to the canvas centre", () => {
    expect(L.center).toEqual({ x: 320, y: 200 });
  });

  test("tile urls use the raster XYZ endpoint with the key", () => {
    const u = new URL(tileUrl({ z: 15, x: 27650, y: 15060 }, "KEY123"));
    expect(u.origin + u.pathname).toBe("https://api.maptiler.com/maps/streets-v2/256/15/27650/15060.png");
    expect(u.searchParams.get("key")).toBe("KEY123");
  });
});

describe("planRenders — skip what is missing or already rendered", () => {
  const slugs = ["cebu-city.lahug", "naga.colon", "liloan.tabla", "mandaue-city.basak"];

  test("published set: only VERIFIED centroids (C1/C4)", () => {
    const plan = planRenders(slugs, centroids, [], { includeUnverified: false });
    expect(plan.render.map((p) => p.slug).sort()).toEqual(["cebu-city.lahug", "naga.colon"]);
    expect(plan.skipped.sort((a, b) => a.slug.localeCompare(b.slug))).toEqual([
      { slug: "liloan.tabla", reason: "unverified" },
      { slug: "mandaue-city.basak", reason: "no-centroid" },
    ]);
  });

  test("review set: unverified candidates ARE rendered so a person can look at them (C3)", () => {
    const plan = planRenders(slugs, centroids, [], { includeUnverified: true });
    expect(plan.render.map((p) => p.slug).sort()).toEqual(["cebu-city.lahug", "liloan.tabla", "naga.colon"]);
  });

  test("does not re-render an image that already exists", () => {
    const plan = planRenders(slugs, centroids, ["cebu-city.lahug.webp"], { includeUnverified: false });
    expect(plan.render.map((p) => p.slug)).toEqual(["naga.colon"]);
    expect(plan.skipped).toContainEqual({ slug: "cebu-city.lahug", reason: "exists" });
  });

  test("output filename is the slug plus .webp", () => {
    expect(planRenders(["naga.colon"], centroids, [], { includeUnverified: false }).render[0]!.file).toBe("naga.colon.webp");
  });
});
