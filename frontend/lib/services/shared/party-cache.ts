import { unstable_cache } from "next/cache";
import { PartyRepository } from "../../repositories/party.repository";
import { getPartyLogo } from "../../utils/party-utils";

export const getCachedPartyInfoMap = unstable_cache(
  async () => {
    const partyRepo = new PartyRepository();
    const parties = await partyRepo.getAllParties();
    
    const cache: Record<string, any> = {};
    for (const p of parties) {
      const pk = (p.PK || "").toUpperCase();
      const data = {
        logo: getPartyLogo(p.short_name) || p.logo_url,
        short_name: p.short_name,
        color_bg: p.color_bg,
        color_text: p.color_text,
        color_border: p.color_border,
        name: p.name
      };
      cache[pk] = data;
      if (data.short_name) {
        cache[`PARTY#${data.short_name.toUpperCase()}`] = data;
      }
      if (p.name) {
        cache[`PARTY#${p.name.toUpperCase()}`] = data;
      }
    }
    return cache;
  },
  ["shared-party-cache-map"],
  { revalidate: 86400, tags: ["parties"] }
);

export async function getSharedPartyInfo(partyId: string | null | undefined) {
  if (!partyId) return { logo: null, short_name: null, color_bg: null, color_text: null, color_border: null };
  try {
    const cache = await getCachedPartyInfoMap();
    return cache[partyId.toUpperCase()] || { logo: null, short_name: null, color_bg: null, color_text: null, color_border: null };
  } catch (error) {
    console.error("Error getting shared party info:", error);
    return { logo: null, short_name: null, color_bg: null, color_text: null, color_border: null };
  }
}
