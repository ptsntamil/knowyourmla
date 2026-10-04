import { PartyObj } from "@/types/models";

// List of names that should not be considered as a political party
const NON_PARTY_NAMES = ["independent", "ind"];

/**
 * Consistently generates a slug for a party name or object.
 * Logic: (slug || short_name || name).toLowerCase().replace(/\s+/g, '-')
 * 
 * @param party - Party name string or PartyObj object
 * @returns Normalized party slug
 */
export function getPartySlug(party?: string | PartyObj | null): string {
  if (!party) return "independent";

  if (typeof party === 'string') {
    const p = party.toLowerCase().trim();
    if (NON_PARTY_NAMES.includes(p)) return "independent";
    return p.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  const name = (party.short_name || party.name || "").toLowerCase().trim();
  if (NON_PARTY_NAMES.includes(name)) return "independent";
  return name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Resolves the local logo path for a party based on its short name.
 * Format: /party/symbol/{short_name}.png
 * 
 * @param shortName - Party short name
 * @returns Local logo path or null
 */
export function getPartyLogo(shortName?: string | null): string | null {
  if (!shortName) return null;
  const name = shortName.toLowerCase().trim();
  if (NON_PARTY_NAMES.includes(name)) return null;
  return `/party/symbol/${name}.png`;
}

/**
 * Derives a short name for a party if one is not provided.
 * Logic: First letter of each word, excluding common stop words.
 * 
 * @param name - Full party name
 * @returns Derived short name acronym or "IND"
 */
export function derivePartyShortName(name?: string | null): string {
  if (!name) return "IND";
  const normalized = name.trim();
  if (NON_PARTY_NAMES.includes(normalized.toLowerCase())) return "IND";

  const words = normalized
    .split(/\s+/)
    .filter(word => word.length > 0 && !["of", "and", "the", "&", "a", "party"].includes(word.toLowerCase()));

  if (words.length === 1) {
    // If it's a single word (like "DMK" or "AIADMK"), return it as is but uppercased.
    // If it's very long, slice it, but typically acronyms are passed as-is.
    return words[0].length <= 8 ? words[0].toUpperCase() : words[0].slice(0, 3).toUpperCase();
  }

  const acronym = words
    .map(word => word[0].toUpperCase())
    .join("");

  // Remove non-alphanumeric chars (e.g. if a word was "(DMK)")
  return acronym.replace(/[^A-Z]/g, "") || normalized.slice(0, 3).toUpperCase();
}
