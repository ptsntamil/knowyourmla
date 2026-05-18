import { TN_PARTY_DISPLAY_ORDER } from "./dashboard.constants";

/**
 * Returns the rank of a party based on the defined display order.
 * Parties not in the list get a higher rank (sorted alphabetically at the end).
 */
export function getPartyRank(shortName: string | null | undefined): number {
    if (!shortName) return 1000;
    
    const normalized = shortName.toUpperCase();
    
    // 1. Independent is always last
    if (normalized === "IND" || normalized === "INDEPENDENT") return 1000;
    
    // 2. Priority list
    const index = TN_PARTY_DISPLAY_ORDER.indexOf(normalized);
    if (index !== -1) return index;
    
    // 3. Other parties (Alphabetical fallback)
    return 100 + normalized.charCodeAt(0);
}

/**
 * Generic sorting function to order items by party priority.
 */
export function sortByPartyOrder<T>(
    items: T[], 
    getPartyShort: (item: T) => string | null | undefined
): T[] {
    return [...items].sort((a, b) => {
        const rankA = getPartyRank(getPartyShort(a));
        const rankB = getPartyRank(getPartyShort(b));
        
        if (rankA !== rankB) return rankA - rankB;
        
        // Secondary sort by name if ranks are same
        return 0; 
    });
}
