import { DistrictRepository } from "../repositories/district.repository";
import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PersonRepository } from "../repositories/person.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { PartyRepository } from "../repositories/party.repository";
import { 
  DistrictResponse, 
  DistrictDetailResponse, 
  DistrictStatYear,
  DistrictInsights,
  DistrictMLA 
} from "@/types/models";
import { formatAssets, normalizeEducation, buildInsights, calculateAge } from "../utils/insights";
import { getPartyLogo } from "../utils/party-utils";
import { normalizeTotalAssets } from "../utils/profile-normalizers";
import { LATEST_ELECTION_YEAR } from "../constants/elections";


export class DistrictService {
  private districtRepo: DistrictRepository;
  private constituencyRepo: ConstituencyRepository;
  private personRepo: PersonRepository;
  private candidateRepo: CandidateRepository;
  private partyRepo: PartyRepository;
  private _partyCache: Record<string, any> | null = null;

  constructor(
    districtRepo?: DistrictRepository, 
    constituencyRepo?: ConstituencyRepository,
    personRepo?: PersonRepository,
    candidateRepo?: CandidateRepository,
    partyRepo?: PartyRepository
  ) {
    this.districtRepo = districtRepo || new DistrictRepository();
    this.constituencyRepo = constituencyRepo || new ConstituencyRepository();
    this.personRepo = personRepo || new PersonRepository();
    this.candidateRepo = candidateRepo || new CandidateRepository();
    this.partyRepo = partyRepo || new PartyRepository();
  }

  async getAllDistricts(): Promise<DistrictResponse[]> {
    const districts = await this.districtRepo.getAllDistricts();
    districts.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    return districts.map((d: any) => ({
      id: d.PK,
      name: d.name,
      slug: d.PK.replace("DISTRICT#", "").toLowerCase(),
      total_constituencies: d.total_constituencies || 0,
      image_url: d.image_url,
    }));
  }

  async getDistrictDetails(districtId: string): Promise<DistrictDetailResponse> {
    const [district, constituencies] = await Promise.all([
      this.districtRepo.getDistrictById(districtId),
      this.constituencyRepo.getConstituenciesByDistrict(districtId)
    ]);

    if (!district) {
      throw new Error("District not found");
    }

    // Aggregate statistics from constituencies
    const statsMap: Record<number, DistrictStatYear> = {};

    for (const constituency of constituencies) {
      if (constituency.statistics) {
        for (const [year, data] of Object.entries(constituency.statistics)) {
          const y = parseInt(year);
          const d = data as any;
          
          if (!statsMap[y]) {
            statsMap[y] = {
              year: y,
              total_electors: 0,
              male: 0,
              female: 0,
              third_gender: 0,
            };
          }

          statsMap[y].total_electors += (d.total_electors || 0);
          statsMap[y].male = (statsMap[y].male || 0) + (d.male || 0);
          statsMap[y].female = (statsMap[y].female || 0) + (d.female || 0);
          statsMap[y].third_gender = (statsMap[y].third_gender || 0) + (d.third_gender || 0);
        }
      }
    }

    const stats = Object.values(statsMap).sort((a, b) => b.year - a.year);

    return {
      id: district.PK,
      name: district.name,
      description: district.description,
      total_constituencies: district.total_constituencies || 0,
      image_url: district.image_url,
      stats: stats,
    };
  }

  async getDistrictInsights(districtId: string): Promise<{ insights: DistrictInsights; mlas: DistrictMLA[] }> {
    const mlas = await this.getDistrictMLAs(districtId);

    if (mlas.length === 0) {
      return {
        insights: {
          averageAge: null,
          youngestMla: null,
          oldestMla: null,
          richestMla: null,
          highestMarginMla: null,
          highestVotesMla: null,
          dominantParty: null,

          genderSplit: { male: 0, female: 0, other: 0, unknown: 0 },
          educationSummary: null,
          fresherVsRepeat: { fresher: 0, repeat: 0, unknown: 0 }
        },
        mlas: []
      };
    }

    const insights = buildInsights(mlas);

    return { insights, mlas };
  }



  async getDistrictMLAs(districtId: string): Promise<DistrictMLA[]> {
    const constituencies = await this.constituencyRepo.getConstituenciesByDistrict(districtId);
    
    // 1. Get latest winners for these constituencies
    const winnerPromises = constituencies.map(c => this.constituencyRepo.getWinnerHistory(c.PK));
    const winnersResults = await Promise.all(winnerPromises);
    
    const currentWinners = winnersResults.map(history => {
      return history.find((h: any) => parseInt(h.year) === parseInt(LATEST_ELECTION_YEAR));
    }).filter(Boolean);

    if (currentWinners.length === 0) return [];

    // 2. Fetch Person details in batch
    const personIds = currentWinners.map((w: any) => w.person_id).filter(Boolean);
    const persons = await this.personRepo.getPersonsByIds(personIds);
    const personMap = persons.reduce((acc: any, p: any) => {
      acc[p.PK] = p;
      return acc;
    }, {});

    // 3. Ensure party info is cached
    await this.ensurePartyCache();

    // 3. Build DistrictMLA objects
    const mlaPromises = currentWinners.map(async (w: any) => {
      const person = personMap[w.person_id] || {};
      const constituency = constituencies.find(c => c.PK === w.constituency_id);
      
      // Strict bio data from person table as source of truth
      // birth_year/birthyear and sex/gender are the common variations in the person table
      const birthYear = person.birth_year || person.birthyear;
      const age = calculateAge(birthYear) || (person.age ? parseInt(person.age) : null);
      const gender = (person.sex || person.gender || "").toLowerCase();
      
      const assets = normalizeTotalAssets(w.total_assets);

      const partyInfo = await this.getPartyInfo(w.party_id);
      const partyShort = partyInfo.short_name || w.party_id?.replace("PARTY#", "") || "IND";

      return {
        name: person.name || w.candidate_name || "Unknown",
        age,
        slug: (person.name || w.candidate_name || "Unknown").toLowerCase().replace(/[^a-z0-9]/g, "-"),
        constituency: constituency?.name || w.constituency_id?.replace("CONSTITUENCY#", ""),
        constituencyId: w.constituency_id,
        party: partyShort,
        partyShort: partyShort,
        partyColor: partyInfo.color_bg,
        partyColorText: partyInfo.color_text,
        partyColorBorder: partyInfo.color_border,
        partyLogoUrl: partyInfo.logo,
        assets,
        formattedAssets: formatAssets(assets),
        image_url: person.image_url || w.profile_pic || null,
        isFresher: (w.total_wins !== undefined && w.total_wins !== null) ? Number(w.total_wins) === 1 : undefined,
        gender: gender || "unknown",
        education: person.education || w.education // Prioritize person-level education if available
      };

    });

    return Promise.all(mlaPromises);
  }

  private async ensurePartyCache() {
    if (this._partyCache === null) {
      try {
        const parties = await this.partyRepo.getAllParties();
        this._partyCache = {};
        for (const p of parties) {
          const pk = (p.PK || "").toUpperCase();
          const data = {
            logo: getPartyLogo(p.short_name) || p.logo_url,
            short_name: p.short_name,
            color_bg: p.color_bg,
            color_text: p.color_text,
            color_border: p.color_border,
          };
          this._partyCache[pk] = data;
          if (data.short_name) {
            this._partyCache[`PARTY#${data.short_name.toUpperCase()}`] = data;
          }
          if (p.name) {
            this._partyCache[`PARTY#${p.name.toUpperCase()}`] = data;
          }
        }
      } catch (error) {
        console.error("Error building party cache:", error);
        this._partyCache = {};
      }
    }
  }

  private async getPartyInfo(partyId: string) {
    if (!partyId) return { logo: null, short_name: null, color_bg: null, color_text: null, color_border: null };
    await this.ensurePartyCache();
    return this._partyCache?.[partyId.toUpperCase()] || { logo: null, short_name: null, color_bg: null, color_text: null, color_border: null };
  }
}


