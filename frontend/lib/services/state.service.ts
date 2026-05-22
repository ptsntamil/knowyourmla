import { DistrictRepository } from "../repositories/district.repository";
import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PersonRepository } from "../repositories/person.repository";
import { MLARepository } from "../repositories/mla.repository";
import { PartyRepository } from "../repositories/party.repository";
import { DistrictMLA, DistrictInsights } from "@/types/models";
import { formatAssets, buildInsights, calculateAge, getDistributionData } from "../utils/insights";
import { normalizeEducation, normalizeTotalAssets } from "../utils/profile-normalizers";
import { normalizeCandidateProfilePic } from "../utils/profile-pic.utils";
import { unstable_cache } from "next/cache";

export interface StateOverviewResponse {
  totalConstituencies: number;
  totalMLAs: number;
  totalDistricts: number;
  partySpread: number;
  insights: DistrictInsights;
  mlas: DistrictMLA[];
  districts: any[];
  districtCountMap: Record<string, number>;
  distributions: {
    party: { label: string; value: number }[];
    education: { label: string; value: number }[];
    gender: { label: string; value: number }[];
    age: { label: string; value: number }[];
  };
}


export class StateService {
  private districtRepo: DistrictRepository;
  private constituencyRepo: ConstituencyRepository;
  private personRepo: PersonRepository;
  private mlaRepo: MLARepository;
  private partyRepo: PartyRepository;
  private _partyCache: Record<string, any> | null = null;

  constructor(
    districtRepo?: DistrictRepository,
    constituencyRepo?: ConstituencyRepository,
    personRepo?: PersonRepository,
    mlaRepo?: MLARepository,
    partyRepo?: PartyRepository
  ) {
    this.districtRepo = districtRepo || new DistrictRepository();
    this.constituencyRepo = constituencyRepo || new ConstituencyRepository();
    this.personRepo = personRepo || new PersonRepository();
    this.mlaRepo = mlaRepo || new MLARepository();
    this.partyRepo = partyRepo || new PartyRepository();
  }

  private async ensurePartyCache() {
    if (this._partyCache === null) {
      try {
        const parties = await this.partyRepo.getAllParties();
        this._partyCache = {};
        for (const p of parties) {
          const pk = (p.PK || "").toUpperCase();
          const data = {
            logo: p.logo_url,
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

  async getStateOverview(): Promise<StateOverviewResponse> {
    return unstable_cache(
      async (): Promise<StateOverviewResponse> => {
        const [districts, constituencies, winners] = await Promise.all([
          this.districtRepo.getAllDistricts(),
          this.constituencyRepo.getAllConstituencies(),
          this.mlaRepo.getWinnersByYearRange(2026, 2031)
        ]);

        // Filter only 2026 winners
        const currentWinners = winners.filter((w: any) => parseInt(w.year) === 2026);

        // Fetch person details
        const personIds = Array.from(new Set(currentWinners.map((w: any) => w.person_id).filter(Boolean)));
        const persons = await this.personRepo.getPersonsByIds(personIds as string[]);
        const personMap = persons.reduce((acc: any, p: any) => {
          acc[p.PK] = p;
          return acc;
        }, {});

        await this.ensurePartyCache();

        const mlaList: DistrictMLA[] = await Promise.all(currentWinners.map(async (w: any) => {
          const person = personMap[w.person_id] || {};
          const constituency = constituencies.find((c: any) => c.PK === w.constituency_id);

          const birthYear = person.birth_year || person.birthyear;
          const age = calculateAge(birthYear) || (person.age ? parseInt(person.age) : null);
          const gender = (person.sex || person.gender || "").toLowerCase();
          const assets = normalizeTotalAssets(w.total_assets);
          const margin = normalizeTotalAssets(w.winning_margin || w.margin);
          const votes = normalizeTotalAssets(w.total_votes);

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
            margin,
            votes,
            image_url: normalizeCandidateProfilePic(person.image_url || w.profile_pic) || undefined,
            isFresher: (w.total_wins !== undefined && w.total_wins !== null) ? Number(w.total_wins) === 1 : undefined,
            gender: gender || "unknown",
            education: normalizeEducation(person.education || w.education)
          };

        }));

        const insights = buildInsights(mlaList as any);
        const partySpread = new Set(mlaList.map(m => m.party)).size;

        // Calculate constituency count map
        const districtCountMap: Record<string, number> = {};
        constituencies.forEach((c: any) => {
          if (c.district_id) {
            districtCountMap[c.district_id] = (districtCountMap[c.district_id] || 0) + 1;
          }
        });

        return {
          totalConstituencies: constituencies.length,
          totalMLAs: mlaList.length,
          totalDistricts: districts.length,
          partySpread,
          insights,
          mlas: mlaList,
          districts: districts.map((d: any) => ({
            id: d.PK,
            name: d.name,
            slug: d.PK.replace("DISTRICT#", "").toLowerCase(),
            total_constituencies: districtCountMap[d.PK] || d.total_constituencies || 0,
            image_url: d.image_url
          })),
          districtCountMap,
          distributions: {
            party: getDistributionData(mlaList, 'party'),
            education: getDistributionData(mlaList, 'education'),
            gender: getDistributionData(mlaList, 'gender'),
            age: getDistributionData(mlaList, 'age')
          }
        };
      },
      ["state-overview"],
      { revalidate: 86400, tags: ["state-summary"] }
    )();
  }
}
