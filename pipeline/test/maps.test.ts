import { describe, expect, test } from "vitest";
import { mapUrl, planRenders, type Centroid } from "../src/maps/render";

const centroids: Centroid[] = [
  { slug: "cebu-city.lahug", lat: 10.3322, lon: 123.8996, source: "nominatim", verified: true },
  { slug: "naga.colon", lat: 10.2183, lon: 123.7581, source: "nominatim", verified: true },
  { slug: "liloan.tabla", lat: 10.4, lon: 123.99, source: "nominatim", verified: false },
];

describe("mapUrl — MapTiler Static Maps, one image per barangay (ONBOARDING-AND-TOUR §4)", () => {
  test("640x400 webp, zoom 15, single marker at the centroid, key from the caller", () => {
    const u = new URL(mapUrl(centroids[0]!, "KEY123"));
    expect(u.origin + u.pathname).toBe("https://api.maptiler.com/maps/streets-v2/static/123.8996,10.3322,15/640x400.webp");
    expect(u.searchParams.get("key")).toBe("KEY123");
    expect(u.searchParams.get("markers")).toBe("123.8996,10.3322");
  });
});

describe("planRenders — skip what is missing or already rendered", () => {
  const slugs = ["cebu-city.lahug", "naga.colon", "liloan.tabla", "mandaue-city.basak"];

  test("renders only VERIFIED centroids (C1/C4): unverified or absent → no map, never an approximate one", () => {
    const plan = planRenders(slugs, centroids, []);
    expect(plan.render.map((p) => p.slug).sort()).toEqual(["cebu-city.lahug", "naga.colon"]);
    expect(plan.skipped.sort()).toEqual([
      { slug: "liloan.tabla", reason: "unverified" },
      { slug: "mandaue-city.basak", reason: "no-centroid" },
    ].sort((a, b) => a.slug.localeCompare(b.slug)));
  });

  test("does not re-render an image that already exists", () => {
    const plan = planRenders(slugs, centroids, ["cebu-city.lahug.webp"]);
    expect(plan.render.map((p) => p.slug)).toEqual(["naga.colon"]);
    expect(plan.skipped).toContainEqual({ slug: "cebu-city.lahug", reason: "exists" });
  });

  test("output filename is the slug plus .webp", () => {
    expect(planRenders(["naga.colon"], centroids, []).render[0]!.file).toBe("naga.colon.webp");
  });
});
