import { describe, expect, test } from "vitest";
import { resolveAreas } from "../src/areas";
import { normalizeText } from "../src/normalize";

const R = (s: string) => resolveAreas(normalizeText(s));

describe("resolveAreas — ARCH §5.4 registry scan", () => {
  test("simple grammar: barangays before LGU", () => {
    const r = R("Portion of Tapul, Talisay City, along portion of Tapul Brgy. Road.");
    expect(r.lgus).toEqual(["talisay-city"]);
    expect(r.barangays).toEqual(["talisay-city.tapul"]);
    expect(r.unknownTokens).toEqual([]);
    expect(r.ambiguous).toBe(false);
  });

  test("real defect: doubled comma, ampersand list, and a sitio in the tail named San Roque", () => {
    const r = R(
      "Portion of Camputhaw,, Lahug & San Roque, Cebu City, along portion of Gorordo Avenue, including portions of Sitios Avocado, Drihoa, Kamagong, Kawayan, & San Roque, and Gochan Hills, Kintanar Compound, & Up Compound.",
    );
    expect(r.lgus).toEqual(["cebu-city"]);
    expect(r.barangays.sort()).toEqual(["cebu-city.camputhaw", "cebu-city.lahug", "cebu-city.san-roque"]);
    expect(r.barangays.filter((b) => b.endsWith("san-roque"))).toHaveLength(1);
    expect(r.unknownTokens).toEqual([]);
  });

  test("parenthesised grammar: LGUs first, barangays in parens, two LGUs, no comma before 'along'", () => {
    const r = R(
      "Portion of City of Naga & Minglanilla (Alpaco, Balirong, Cantao‑an, Cogon, Jaguimit, Lanas, Lutac, Mayana, Pangdan, South Poblacion, Tagjaguimit, Uling & Camp 8) along portions of Balirong Road, Naga Uling Road, Naga-Uling Road, & Tagjagumit Road.",
    );
    expect(r.lgus.sort()).toEqual(["minglanilla", "naga"]);
    expect(r.barangays).toHaveLength(13);
    expect(r.barangays.filter((b) => b.startsWith("naga."))).toHaveLength(12);
    expect(r.barangays).toContain("minglanilla.camp-8");
    expect(r.barangays).toContain("naga.cantao-an");
    expect(r.barangays).toContain("naga.alfaco");
    expect(r.unknownTokens).toEqual([]);
  });

  test("Type 1 collision: Colon resolves to Naga only, never to Cebu City's Colon Street", () => {
    const r = R("Portion of Colon, City of Naga, along portion of Cebu South Road.");
    expect(r.barangays).toEqual(["naga.colon"]);
  });

  test("Type 2 collision: San Roque in Liloan does not match Cebu City's; Sta. Cruz expands (R13)", () => {
    const r = R("Portion of Lataban, San Roque, San Vicente, Sta. Cruz & Tabla, Liloan, along Aurelio V. Pepito Sr. St., Maple St.");
    expect(r.lgus).toEqual(["liloan"]);
    expect(r.barangays.sort()).toEqual([
      "liloan.lataban", "liloan.san-roque", "liloan.san-vicente", "liloan.santa-cruz", "liloan.tabla",
    ]);
  });

  test("Type 3 collision: a short form matching two same-LGU barangays fans out and is flagged (R12)", () => {
    const r = R("Portion of Basak, Cebu City, along portion of N. Bacalso Avenue.");
    expect(r.barangays.sort()).toEqual(["cebu-city.basak-pardo", "cebu-city.basak-san-nicolas"]);
    expect(r.ambiguous).toBe(true);
  });

  test("Type 3: 'Pardo' alone means barangay Pardo, not its six neighbours", () => {
    const r = R("Portion of Pardo, Cebu City, along portion of Cebu South Road.");
    expect(r.barangays).toEqual(["cebu-city.pardo"]);
    expect(r.ambiguous).toBe(false);
  });

  test("full-token consumption: 'Lawaan II' does not also match 'Lawaan I' (R11)", () => {
    const r = R("Portion of Lawaan II, Talisay City, along portion of Lawaan Road.");
    expect(r.barangays).toEqual(["talisay-city.lawaan-ii"]);
  });

  test("VECO spellings resolve through aliases: Hipodromo, To-ong", () => {
    expect(R("Portion of Hipodromo, Cebu City, along portions of Ayala Access Road.").barangays).toEqual(["cebu-city.hippodromo"]);
    expect(R("Portion of To-ong, Cebu City, along portion of Sitio Angay-Angay Road.").barangays).toEqual(["cebu-city.to-ong-pardo"]);
    expect(R("Portion of Banilad, Budlaan & Busay, Cebu City along portions of Maria Luisa Subdivision.").barangays.sort()).toEqual(["cebu-city.banilad", "cebu-city.budla-an", "cebu-city.busay"]);
  });

  test("Type 1: a barangay name appearing only in the tail (Sitio Nangka) is not matched", () => {
    const r = R("Portion of Casuntingan, Maguikay & Bakilid, Mandaue City, along portion of M.L. Quezon Avenue, including portions of Sitios Nangka & Tambis, and Country Club Village.");
    expect(r.barangays).not.toContain("consolacion.nangka");
    expect(r.barangays.sort()).toEqual(["mandaue-city.bakilid", "mandaue-city.casuntingan", "mandaue-city.maguikay"]);
  });

  test("unknown area token is reported, not dropped (NFR-22)", () => {
    const r = R("Portion of Zzyzx, Cebu City, along portion of Somewhere Street.");
    expect(r.barangays).toEqual([]);
    expect(r.unknownTokens).toEqual(["Zzyzx"]);
  });

  test("known and unknown together: the known one still resolves", () => {
    const r = R("Portion of Lahug & Zzyzx, Cebu City, along portion of Gorordo Avenue.");
    expect(r.barangays).toEqual(["cebu-city.lahug"]);
    expect(r.unknownTokens).toEqual(["Zzyzx"]);
  });

  test("no LGU detected → no barangays, and the whole head is reported unknown", () => {
    const r = R("Portion of Lahug, along portion of Gorordo Avenue.");
    expect(r.lgus).toEqual([]);
    expect(r.barangays).toEqual([]);
    expect(r.unknownTokens).toEqual(["Lahug"]);
  });

  test("corpus: VECO's long form 'Lorega-San Miguel' resolves through the alias", () => {
    const r = R("Portion of Lorega-San Miguel, Cebu City, along portion of Lorega Street.");
    expect(r.barangays).toEqual(["cebu-city.lorega"]);
    expect(r.unknownTokens).toEqual([]);
  });

  test("loose fallback: a token that STARTS WITH a known name still resolves, but stays flagged for alias review", () => {
    const r = R("Portion of Lahug-Kamagayan Road Area, Cebu City, along X.");
    expect(r.barangays).toEqual(["cebu-city.lahug"]);
    expect(r.unknownTokens).toEqual(["Lahug-Kamagayan Road Area"]);
  });

  test("loose fallback never matches a name that is not at the start of the token", () => {
    const r = R("Portion of Sitio Lahug, Cebu City, along X.");
    expect(r.barangays).toEqual([]);
    expect(r.unknownTokens).toEqual(["Sitio Lahug"]);
  });

  test("corpus: the typo 'Portions od' is stripped like 'Portions of'", () => {
    const r = R("Portion of Pooc, Talisay City, Portions od Corona Del Mar Subd, along X.");
    expect(r.barangays).toEqual(["talisay-city.pooc"]);
    expect(r.unknownTokens).toEqual(["Corona Del Mar Subd"]);
  });

  test("no 'along' at all: the whole text is treated as the head", () => {
    const r = R("Portion of Lahug, Cebu City.");
    expect(r.barangays).toEqual(["cebu-city.lahug"]);
  });
});
