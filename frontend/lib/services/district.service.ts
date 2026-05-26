import { DistrictRepository } from "../repositories/district.repository";
import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PersonRepository } from "../repositories/person.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { PartyRepository } from "../repositories/party.repository";
import { MLARepository } from "../repositories/mla.repository";
import { unstable_cache } from "next/cache";
import { 
  DistrictResponse, 
  DistrictDetailResponse, 
  DistrictStatYear,
  DistrictInsights,
  DistrictMLA 
} from "@/types/models";
import { formatAssets, categorizeEducation, buildInsights, calculateAge } from "../utils/insights";
import { getPartyLogo } from "../utils/party-utils";
import { normalizeTotalAssets } from "../utils/profile-normalizers";
import { LATEST_ELECTION_YEAR } from "../constants/elections";
import { normalizeCandidateProfilePic } from "../utils/profile-pic.utils";
import { getSharedPartyInfo } from "./shared/party-cache";

export class DistrictService {
  private districtRepo: DistrictRepository;
  private constituencyRepo: ConstituencyRepository;
  private personRepo: PersonRepository;
  private candidateRepo: CandidateRepository;
  private partyRepo: PartyRepository;
  private mlaRepo: MLARepository;

  constructor(
    districtRepo?: DistrictRepository, 
    constituencyRepo?: ConstituencyRepository,
    personRepo?: PersonRepository,
    candidateRepo?: CandidateRepository,
    partyRepo?: PartyRepository,
    mlaRepo?: MLARepository
  ) {
    this.districtRepo = districtRepo || new DistrictRepository();
    this.constituencyRepo = constituencyRepo || new ConstituencyRepository();
    this.personRepo = personRepo || new PersonRepository();
    this.candidateRepo = candidateRepo || new CandidateRepository();
    this.partyRepo = partyRepo || new PartyRepository();
    this.mlaRepo = mlaRepo || new MLARepository();
  }

  async getAllDistricts(): Promise<DistrictResponse[]> {
    return unstable_cache(
      async () => {
        const districts = await this.districtRepo.getAllDistricts();
        districts.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        return districts.map((d: any) => ({
          id: d.PK,
          name: d.name,
          slug: d.PK.replace("DISTRICT#", "").toLowerCase(),
          total_constituencies: d.total_constituencies || 0,
          image_url: d.image_url,
        }));
      },
      ["districts-list"],
      { revalidate: 86400, tags: ["districts"] }
    )();
  }

  async getDistrictDetails(districtId: string): Promise<DistrictDetailResponse> {
    return unstable_cache(
      async (dId: string): Promise<DistrictDetailResponse> => {
        const districtId = dId;
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
      },
      ["district-details", districtId],
      { revalidate: 86400, tags: [`district-detail-${districtId}`] }
    )(districtId);
  }

  async getDistrictInsights(districtId: string): Promise<{ insights: DistrictInsights; mlas: DistrictMLA[] }> {
    return unstable_cache(
      async (dId: string): Promise<{ insights: DistrictInsights; mlas: DistrictMLA[] }> => {
        const districtId = dId;
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
      },
      ["district-insights", districtId],
      { revalidate: 86400, tags: [`district-insights-${districtId}`] }
    )(districtId);
  }

  async getDistrictMLAs(districtId: string): Promise<DistrictMLA[]> {
    return unstable_cache(
      async (dId: string): Promise<DistrictMLA[]> => {
        const districtId = dId;
        const constituencies = await this.constituencyRepo.getConstituenciesByDistrict(districtId);
        
        // 1. Get latest winners for these constituencies
        const winnerPromises = constituencies.map(c => this.constituencyRepo.getWinnerHistory(c.PK));
        const winnersResults = await Promise.all(winnerPromises);
        
        let currentWinners = winnersResults.map(history => {
          return history.find((h: any) => parseInt(h.year) === parseInt(LATEST_ELECTION_YEAR));
        }).filter(Boolean);

        // Fallback to previous election year if latest (2026) hasn't happened or has no data yet
        if (currentWinners.length === 0) {
          const { PREVIOUS_ELECTION_YEAR } = await import("../constants/elections");
          currentWinners = winnersResults.map(history => {
            return history.find((h: any) => parseInt(h.year) === parseInt(PREVIOUS_ELECTION_YEAR));
          }).filter(Boolean);
        }

        if (currentWinners.length === 0) return [];

        // 2. Fetch Person details in batch
        const personIds = currentWinners.map((w: any) => w.person_id).filter(Boolean);
        const persons = await this.personRepo.getPersonsByIds(personIds);
        const personMap = persons.reduce((acc: any, p: any) => {
          acc[p.PK] = p;
          return acc;
        }, {});

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

          const partyInfo = await getSharedPartyInfo(w.party_id);
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
            image_url: normalizeCandidateProfilePic(person.image_url || w.profile_pic) || undefined,
            isFresher: (w.total_wins !== undefined && w.total_wins !== null) ? Number(w.total_wins) === 1 : undefined,
            gender: gender || "unknown",
            education: person.education || w.education, // Prioritize person-level education if available
            is_resigned: Boolean(w.is_resigned)
          };

        });

        return Promise.all(mlaPromises);
      },
      ["district-mlas", districtId],
      { revalidate: 86400, tags: [`district-mlas-${districtId}`] }
    )(districtId);
  }
}


