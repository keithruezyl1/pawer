import { createHash } from "node:crypto";

/** Stable content id: same post + same window + same area text → same id, across re-parses (ARCH §6.1). */
export function outageId(postUrl: string, startIso: string, endIso: string, areasRaw: string): string {
  return createHash("sha256").update(`${postUrl}\n${startIso}\n${endIso}\n${areasRaw}`).digest("hex").slice(0, 16);
}
