export type DemographicCategory = "Urban" | "Semi Urban" | "Rural";

/**
 * Extracts demographic category from a constituency item.
 * Defaults to "Rural" if not specified.
 */
export function getConstituencyDemographics(
  demographic: string | undefined | null
): DemographicCategory {
  if (!demographic) return "Rural";
  
  const normalized = demographic.toLowerCase();
  
  if (normalized === "urban") return "Urban";
  if (normalized === "semi urban") return "Semi Urban";
  
  return "Rural";
}
