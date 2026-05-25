import { ConstituencyService } from "./constituency.service";
import { DistrictService } from "./district.service";

export interface SearchResult {
  id: string;
  name: string;
  type: "constituency" | "district" | "person";
  slug: string;
  image?: string;
  subtitle?: string;
}

function getMatchScore(name: string, slug: string, cleanQuery: string): number {
  const cleanName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanSlug = (slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Priority 1: Exact match on name or slug (score = 100)
  if (cleanName === cleanQuery || cleanSlug === cleanQuery) {
    return 100;
  }
  // Priority 2: Starts with on name or slug (score = 50)
  if (cleanName.startsWith(cleanQuery) || cleanSlug.startsWith(cleanQuery)) {
    return 50;
  }
  // Priority 3: Contains on name or slug (score = 10)
  if (cleanName.includes(cleanQuery) || cleanSlug.includes(cleanQuery)) {
    return 10;
  }
  // No match
  return 0;
}

export class SearchService {
  private constituencyService: ConstituencyService;
  private districtService: DistrictService;

  constructor(constituencyService?: ConstituencyService, districtService?: DistrictService) {
    this.constituencyService = constituencyService || new ConstituencyService();
    this.districtService = districtService || new DistrictService();
  }

  async search(query: string, limit: number = 7): Promise<SearchResult[]> {
    if (!query || query.length < 3) return [];

    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "");

    const [constituencies, districts] = await Promise.all([
      this.constituencyService.listConstituencies(),
      this.districtService.getAllDistricts()
    ]);

    const scoredResults: { result: SearchResult; score: number }[] = [];

    // 1. Process Districts
    for (const d of districts) {
      const score = getMatchScore(d.name, d.slug || "", cleanQuery);
      if (score > 0) {
        scoredResults.push({
          result: {
            id: d.id,
            name: d.name,
            type: "district",
            slug: d.slug || d.id.replace("DISTRICT#", "").toLowerCase(),
          },
          score
        });
      }
    }

    // 2. Process Constituencies
    for (const c of constituencies) {
      const score = getMatchScore(c.name, c.slug || "", cleanQuery);
      if (score > 0) {
        scoredResults.push({
          result: {
            id: c.id,
            name: c.name,
            type: "constituency",
            slug: c.slug || c.id.replace("CONSTITUENCY#", "").toLowerCase(),
            subtitle: c.district_id?.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase())
          },
          score
        });
      }
    }

    // Sort by score descending. For stable sort, sub-sort by name length (closer match).
    scoredResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.result.name.length - b.result.name.length;
    });

    return scoredResults.map(sr => sr.result).slice(0, limit);
  }
}
