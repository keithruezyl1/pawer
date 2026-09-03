import { describe, expect, test } from "vitest";
import { normalizeText, foldForMatch } from "../src/normalize";

describe("normalizeText — lossless cleanup for stored/displayed text (ARCH §5.1 steps 1–5)", () => {
  test("unifies the U+2011 non-breaking hyphen VECO uses in Cantao‑an", () => {
    expect(normalizeText("Cantao‑an")).toBe("Cantao-an");
  });

  test("unifies en/em dashes and the minus sign to a plain hyphen", () => {
    expect(normalizeText("a–b—c−d")).toBe("a-b-c-d");
  });

  test("unifies exotic spaces and collapses whitespace runs", () => {
    expect(normalizeText("Lahug & San   Roque")).toBe("Lahug & San Roque");
  });

  test("collapses the doubled comma in 'Camputhaw,, Lahug'", () => {
    expect(normalizeText("Camputhaw,, Lahug")).toBe("Camputhaw, Lahug");
  });

  test("removes a stray space before a comma ('Casuntingan , Maguikay')", () => {
    expect(normalizeText("Casuntingan , Maguikay")).toBe("Casuntingan, Maguikay");
  });

  test("trims whitespace including the zero-width-space defect in ' Time:'", () => {
    expect(normalizeText("​ Time:")).toBe("Time:");
  });

  test("keeps honorific abbreviations verbatim — VECO's text is quoted, not rewritten", () => {
    expect(normalizeText("Sta. Cruz & Tabla")).toBe("Sta. Cruz & Tabla");
    expect(normalizeText("along portion of Tapul Brgy. Road.")).toBe("along portion of Tapul Brgy. Road.");
  });
});

describe("foldForMatch — matching key only, never displayed (ARCH §5.1 steps 6–7)", () => {
  test("casefolds and normalises", () => {
    expect(foldForMatch("Cantao‑An")).toBe("cantao-an");
  });

  test("expands honorific abbreviations so 'Sta. Cruz' reaches 'Santa Cruz' (R13)", () => {
    expect(foldForMatch("Sta. Cruz & Tabla")).toBe("santa cruz & tabla");
    expect(foldForMatch("Sto. Niño")).toBe("santo niño");
  });

  test("strips the 'Brgy.' honorific but leaves the name", () => {
    expect(foldForMatch("serving Brgy. Tapul by")).toBe("serving tapul by");
  });
});
