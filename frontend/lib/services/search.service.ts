import { SearchRepository } from "../repositories/search.repository";

export interface SearchResult {
  id: string;
  name: string;
  type: "constituency" | "district" | "person";
  slug: string;
  image?: string;
  subtitle?: string;
}

export class SearchService {
  private repository: SearchRepository;

  constructor(repository?: SearchRepository) {
    this.repository = repository || new SearchRepository();
  }

  async search(query: string, limit: number = 7): Promise<SearchResult[]> {
    if (!query || query.length < 3) return [];

    const normalizedQuery = query.toLowerCase().trim();

    const [constituencies, districts] = await Promise.all([
      this.repository.searchConstituencies(normalizedQuery, 50),
      this.repository.searchDistricts(normalizedQuery, 50)
    ]);

    const results: SearchResult[] = [];

    // 1. Process Districts
    for (const d of districts) {
      results.push({
        id: d.PK,
        name: d.name,
        type: "district",
        slug: d.PK.replace("DISTRICT#", "").toLowerCase(),
      });
    }

    // 2. Process Constituencies
    for (const c of constituencies) {
      results.push({
        id: c.PK,
        name: c.name,
        type: "constituency",
        slug: c.normalized_name || c.PK.replace("CONSTITUENCY#", ""),
        subtitle: c.district_id?.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase())
      });
    }

    // Sort: exact matches first, then starts_with, then contains
    
    return results.slice(0, limit);
  }
}
