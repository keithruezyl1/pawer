import type { AdvisoriesFile, Outage } from "@pawer/shared";

export function buildAdvisoriesFile(outages: readonly Outage[], generatedAtIso: string): AdvisoriesFile {
  return {
    schema_version: 1,
    generated_at: generatedAtIso,
    source_attribution: "Visayan Electric Company — public service-interruption advisories (visayanelectric.com)",
    outages: [...outages],
  };
}
