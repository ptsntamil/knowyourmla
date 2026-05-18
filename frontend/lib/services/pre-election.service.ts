import { MLARepository } from "../repositories/mla.repository";
import { PartyRepository } from "../repositories/party.repository";
import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PersonRepository } from "../repositories/person.repository";
import { DistrictRepository } from "../repositories/district.repository";
import { 
  PreElectionDashboardData, 
  DashboardCandidate, 
  ContestCard, 
  PartyRolloutSummary, 
  PreElectionInsights,
  PreElectionSnapshotStats,
  ElectionInsightCandidate
} from "@/types/pre-election";
import { getTamilNaduPreElectionDashboardData } from "../elections/preElectionDashboard/getTamilNaduPreElectionDashboardData";

export class PreElectionService {
  private mlaRepo: MLARepository;
  private partyRepo: PartyRepository;
  private constituencyRepo: ConstituencyRepository;
  private personRepo: PersonRepository;
  private districtRepo: DistrictRepository;

  constructor() {
    this.mlaRepo = new MLARepository();
    this.partyRepo = new PartyRepository();
    this.constituencyRepo = new ConstituencyRepository();
    this.personRepo = new PersonRepository();
    this.districtRepo = new DistrictRepository();
  }

  /**
   * Delegates to the centralized dashboard data module.
   * This ensures logic consistency across the application.
   */
  async getTamilNaduPreElectionDashboardData(year: number = 2026): Promise<PreElectionDashboardData | null> {
    if (year !== 2026) {
      // Fallback for non-2026 years if needed, or return null
      return null;
    }

    const dashboardData = await getTamilNaduPreElectionDashboardData();
    if (!dashboardData) return null;

    // Adapt the new payload structure/types to the existing PreElectionDashboardData interface
    // to maintain backward compatibility for existing UI components if any.
    return {
      summary: {
        stateName: "Tamil Nadu",
        electionYear: year,
        title: `Tamil Nadu Assembly Election ${year} Pre-Election Dashboard`,
        description: `Track candidates, constituency-level contests, party rollout, and affidavit-based election insights across Tamil Nadu for the upcoming ${year} Assembly Election.`
      },
      stats: dashboardData.stats as any,
      partyRollout: dashboardData.partyRollout as any,
      constituencyContests: dashboardData.contests as any,
      candidates: dashboardData.candidates as any,
      insights: dashboardData.insights as any,
      faq: [] // FAQ logic can be added to insights or kept here if requested
    };
  }
}
