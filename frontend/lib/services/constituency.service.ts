import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PersonRepository } from "../repositories/person.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { 
  ConstituencyResponse, 
  ConstituencyWinnerHistoryResponse, 
  WinnerHistoryRecord 
} from "@/types/models";
import { getPartyLogo } from "../utils/party-utils";
import { normalizeTotalAssets, normalizeCriminalCases } from "../utils/profile-normalizers";

export class ConstituencyService {
  private repository: ConstituencyRepository;
  private personRepo: PersonRepository;
  private candidateRepo: CandidateRepository;

  constructor(repository?: ConstituencyRepository, personRepo?: PersonRepository, candidateRepo?: CandidateRepository) {
    this.repository = repository || new ConstituencyRepository();
    this.personRepo = personRepo || new PersonRepository();
    this.candidateRepo = candidateRepo || new CandidateRepository();
  }

  async listConstituencies(districtId?: string): Promise<ConstituencyResponse[]> {
    let rawConstituencies;
    if (districtId) {
      rawConstituencies = await this.repository.getConstituenciesByDistrict(districtId);
    } else {
      rawConstituencies = await this.repository.getAllConstituencies();
    }

    const constituencies = rawConstituencies.map((c: any) => ({
      id: c.PK,
      name: c.name,
      slug: c.normalized_name || c.PK.replace("CONSTITUENCY#", ""),
      district_id: c.district_id,
      type: c.type,
    }));
    constituencies.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    return constituencies;
  }

  private slugify(name: string): string {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  private parseMargin(rawMargin: any): number {
    if (!rawMargin) return 0;
    try {
      return parseInt(String(rawMargin).replace(/,/g, ""));
    } catch (error) {
      return 0;
    }
  }

  private async getPartyInfo(partyId: string, partyCache: Record<string, any>) {
    if (!partyId) return { id: "NA" };
    if (partyCache[partyId]) return partyCache[partyId];

    const partyData = (await this.repository.getPartyById(partyId)) || {};
    const info = {
      id: partyId,
      name: partyData.name,
      short_name: partyData.short_name,
      logo_url: getPartyLogo(partyData.short_name) || partyData.logo_url,
      color_bg: partyData.color_bg,
      color_text: partyData.color_text,
      color_border: partyData.color_border,
    };
    partyCache[partyId] = info;
    return info;
  }

  async getWinnerHistory(constituencyId: string): Promise<ConstituencyWinnerHistoryResponse> {
    const rawHistory = await this.repository.getWinnerHistory(constituencyId);
    const personIds = Array.from(new Set(rawHistory.map((h: any) => h.person_id).filter((id: string) => id)));
    const persons = await this.personRepo.getPersonsByIds(personIds as string[]);
    const personMap = persons.reduce((acc: any, p: any) => {
      acc[p.PK] = p;
      return acc;
    }, {});

    const partyCache: Record<string, any> = {};
    const historyRecords: WinnerHistoryRecord[] = [];

    // Sort raw history by year descending manually before loop to identify latest winner easily
    const sortedRawHistory = [...rawHistory].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

    for (let i = 0; i < sortedRawHistory.length; i++) {
      const h = sortedRawHistory[i];
      const margin = this.parseMargin(h.winning_margin);
      const partyInfo = await this.getPartyInfo(h.party_id, partyCache);
      const personMeta = h.person_id ? personMap[h.person_id] || {} : {};
      const winnerName = personMeta.name || h.candidate_name || "Unknown";
      const year = parseInt(h.year) || 0;

      let winRate = personMeta.win_rate;
      let totalWins = personMeta.total_wins;
      let totalContested = personMeta.total_contested;

      // Only calculate win rate for the latest record (current MLA) if missing in metadata
      if (i === 0 && h.person_id && !winRate) {
        try {
          const personHistory = await this.candidateRepo.getPersonHistory(h.person_id);
          totalContested = personHistory.length;
          totalWins = personHistory.filter((c: any) => c.is_winner).length;
          winRate = totalContested > 0 ? parseFloat(((totalWins / totalContested) * 100).toFixed(2)) : 0;
        } catch (error) {
          console.error(`Error calculating win rate for ${h.person_id}:`, error);
        }
      }

      historyRecords.push({
        year,
        winner: winnerName,
        profile_pic: personMeta.image_url || h.profile_pic,
        party: partyInfo,
        margin,
        person_id: h.person_id,
        slug: winnerName !== "Unknown" ? this.slugify(winnerName) : undefined,
        education: h.education || personMeta.education,
        profession: h.profession || personMeta.profession,
        total_assets: normalizeTotalAssets(h.total_assets || personMeta.total_assets),
        criminal_cases: normalizeCriminalCases(h.criminal_cases !== undefined ? h.criminal_cases : personMeta.criminal_cases),
        total_contested: totalContested,
        total_wins: totalWins,
        win_rate: winRate,
        age: personMeta.birth_year ? new Date().getFullYear() - parseInt(personMeta.birth_year) : (personMeta.age ? parseInt(personMeta.age) : undefined),
      });
    }

    const metadata = await this.repository.getConstituencyMetadata(constituencyId);
    const districtId = metadata?.district_id;
    const districtName = metadata?.district_name || (districtId ? districtId.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase()) : undefined);

    const stats: any[] = [];
    if (metadata && metadata.statistics) {
      for (const [year, data] of Object.entries(metadata.statistics)) {
        const d = data as any;
        stats.push({
          year: parseInt(year),
          total_electors: d.total_electors || 0,
          total_votes_polled: d.total_votes_polled || 0,
          poll_percentage: d.poll_percentage || 0,
          male: d.male,
          female: d.female,
          third_gender: d.third_gender,
        });
      }
    }
    stats.sort((a, b) => b.year - a.year);

    return {
      constituency: constituencyId.replace("CONSTITUENCY#", ""),
      district_name: districtName,
      district_id: districtId,
      history: historyRecords,
      stats: stats,
    };
  }
}
