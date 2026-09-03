import type { Outage } from "@pawer/shared";

export interface IssueDraft {
  title: string;
  body: string;
  labels: string[];
}

type Evidence = Pick<Outage, "areas_raw" | "source_post_url" | "start" | "lgus" | "barangays">;

/** NFR-22: an unrecognised area name becomes an issue the maintainer can close with one alias line. */
export function formatUnknownAreaIssue(token: string, o: Evidence): IssueDraft {
  const body = [
    `The parser found an area token it could not match to the barangay registry.`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Token** | \`${token}\` |`,
    `| **LGUs detected** | ${o.lgus.length ? o.lgus.map((l) => `\`${l}\``).join(", ") : "_none_"} |`,
    `| **Barangays resolved** | ${o.barangays.length ? o.barangays.map((b) => `\`${b}\``).join(", ") : "_none_"} |`,
    `| **Outage start** | ${o.start} |`,
    `| **Source** | ${o.source_post_url} |`,
    ``,
    `**Areas Affected, as written:**`,
    ``,
    `> ${o.areas_raw}`,
    ``,
    `**To resolve:** if this is a barangay spelling, add it to \`docs/COVERAGE-GLOSSARY.md\` §5 and run \`npm run build:registry\`. `
      + `If it is a subdivision, sitio, or street that VECO wrote into the head of the sentence, close this issue — the entry already shipped as \`partial\` with the resolved barangays.`,
  ].join("\n");
  return { title: `Unknown area: "${token}"`, body, labels: ["unknown-area"] };
}

export function filterAlreadyOpen(drafts: readonly IssueDraft[], openTitles: readonly string[]): IssueDraft[] {
  const open = new Set(openTitles.map((t) => t.trim().toLowerCase()));
  return drafts.filter((d) => !open.has(d.title.toLowerCase()));
}
