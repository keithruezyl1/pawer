import { describe, expect, test } from "vitest";
import { barangays, lgus, findBarangay, barangaysOf } from "../src/index";

const EXPECTED_PER_LGU: Record<string, number> = {
  "cebu-city": 80,
  "mandaue-city": 27,
  "talisay-city": 22,
  naga: 28,
  liloan: 14,
  consolacion: 21,
  minglanilla: 19,
  "san-fernando": 21,
};

describe("registry shape — COVERAGE-GLOSSARY §4/§6", () => {
  test("exactly eight franchise LGUs, no Lapu-Lapu, no Cordova (R2)", () => {
    expect(lgus.map((l) => l.slug).sort()).toEqual(Object.keys(EXPECTED_PER_LGU).sort());
    expect(lgus.some((l) => /lapu|cordova/i.test(l.display))).toBe(false);
  });

  test("232 barangays with the machine-verified per-LGU counts", () => {
    expect(barangays).toHaveLength(232);
    for (const [lgu, n] of Object.entries(EXPECTED_PER_LGU)) {
      expect(barangaysOf(lgu), lgu).toHaveLength(n);
    }
  });

  test("every slug is {lgu}.{kebab} and unique (R8)", () => {
    const slugs = barangays.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const b of barangays) {
      expect(b.slug.startsWith(`${b.lgu}.`)).toBe(true);
      expect(b.slug).toMatch(/^[a-z-]+\.[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  test("every barangay carries its 9-digit PSGC code and provenance (R6, R7)", () => {
    const codes = new Set<string>();
    for (const b of barangays) {
      expect(b.psgc).toMatch(/^07\d{7}$/);
      codes.add(b.psgc!);
      expect(b.verified_against).toMatch(/psgc/);
    }
    expect(codes.size).toBe(232);
  });

  test("Naga codes carry the Cebu prefix, never Camarines Sur's (R3 — the two-Nagas trap)", () => {
    for (const b of barangaysOf("naga")) expect(b.psgc!.startsWith("072234")).toBe(true);
  });
});

describe("the names that caused trouble", () => {
  test("Colon is a barangay of the City of Naga and nowhere else in the franchise", () => {
    expect(findBarangay("naga.colon")?.display).toBe("Colon");
    expect(barangays.filter((b) => b.display === "Colon")).toHaveLength(1);
  });

  test("Basak: standalone in Mandaue and San Fernando; Basak Pardo and Basak San Nicolas in Cebu City", () => {
    expect(findBarangay("mandaue-city.basak")).toBeDefined();
    expect(findBarangay("san-fernando.basak")).toBeDefined();
    expect(findBarangay("cebu-city.basak-pardo")).toBeDefined();
    expect(findBarangay("cebu-city.basak-san-nicolas")).toBeDefined();
    expect(findBarangay("cebu-city.basak")).toBeUndefined();
  });

  test("San Roque exists in three LGUs and every one is flagged ambiguous_across_lgus", () => {
    const sr = barangays.filter((b) => b.display === "San Roque");
    expect(sr.map((b) => b.lgu).sort()).toEqual(["cebu-city", "liloan", "talisay-city"]);
    expect(sr.every((b) => b.ambiguous_across_lgus)).toBe(true);
  });

  test("Lahug is not ambiguous", () => {
    expect(findBarangay("cebu-city.lahug")?.ambiguous_across_lgus).toBe(false);
  });

  test("PSGC is canonical; every other observed spelling is an alias (R1, R14)", () => {
    expect(findBarangay("cebu-city.camputhaw")?.aliases).toContain("kamputhaw");
    expect(findBarangay("cebu-city.hippodromo")?.aliases).toContain("hipodromo");
    expect(findBarangay("cebu-city.to-ong-pardo")?.aliases).toContain("to-ong");
    expect(findBarangay("naga.alfaco")?.aliases).toContain("alpaco");
    expect(findBarangay("cebu-city.budla-an")?.aliases).toContain("budlaan");
  });

  test("Pardo is its own barangay and is recorded as a substring of six others (R11)", () => {
    const pardo = findBarangay("cebu-city.pardo");
    expect(pardo).toBeDefined();
    expect(pardo!.same_lgu_substring_of).toEqual([
      "cebu-city.basak-pardo",
      "cebu-city.buot-taup-pardo",
      "cebu-city.cogon-pardo",
      "cebu-city.kinasang-an-pardo",
      "cebu-city.quiot-pardo",
      "cebu-city.to-ong-pardo",
    ]);
  });

  test("roman-numeral families are recorded as string prefixes (R11)", () => {
    expect(findBarangay("talisay-city.lawaan-i")?.same_lgu_substring_of.sort())
      .toEqual(["talisay-city.lawaan-ii", "talisay-city.lawaan-iii"]);
    expect(findBarangay("cebu-city.sudlon-i")?.same_lgu_substring_of).toEqual(["cebu-city.sudlon-ii"]);
  });

  test("LGU aliases cover the forms VECO actually writes", () => {
    const naga = lgus.find((l) => l.slug === "naga")!;
    expect(naga.aliases).toEqual(expect.arrayContaining(["city of naga", "naga city", "naga"]));
    const cebu = lgus.find((l) => l.slug === "cebu-city")!;
    expect(cebu.aliases).toContain("cebu city");
  });
});
