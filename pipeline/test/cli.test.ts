import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

// HTTP header values must be ByteStrings (0x00–0xFF). Node's fetch throws on anything else, and a
// typographic dash in the User-Agent took the first real ingest run down. Guard every header literal.
describe("cli.ts header literals", () => {
  const src = readFileSync(new URL("../src/cli.ts", import.meta.url), "utf8");
  test("the User-Agent string is pure ASCII", () => {
    const m = src.match(/const UA = "([^"]*)"/);
    expect(m, "UA literal present").not.toBeNull();
    expect(/^[\x20-\x7E]*$/.test(m![1]!), `non-ASCII in UA: ${m![1]}`).toBe(true);
  });
});

describe("maps/cli.ts User-Agent", () => {
  const src = readFileSync(new URL("../src/maps/ua.ts", import.meta.url), "utf8");
  test("is ASCII and contains the substring the MapTiler key is restricted to", () => {
    const m = src.match(/const MAPS_UA = "([^"]*)"/);
    expect(m).not.toBeNull();
    expect(/^[ -~]*$/.test(m![1]!)).toBe(true);
    expect(m![1]!.includes("PAWER-maps")).toBe(true);
  });
});
