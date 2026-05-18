import { 
  PreElectionSnapshotStats, 
  PartyRolloutSummary, 
  ContestCard, 
  DashboardCandidate,
  ElectionInsightCandidate
} from "@/types/pre-election";

export interface DashboardInsights {
  youngestCandidates: ElectionInsightCandidate[];
  oldestCandidates: ElectionInsightCandidate[];
  richestCandidates: ElectionInsightCandidate[];
  mostCriminalCases: ElectionInsightCandidate[];
  closestLastElectionSeats: ContestCard[];
  multiCornerContests: ContestCard[];
  openSeatsCount: number;
  incumbentRecontestCount: number;
  averageCandidateAge: number | null;
  contestTypePatterns?: {
    ownCount: number;
    crossCount: number;
    ownPercent: number;
    crossPercent: number;
    topCrossParties: { partyName: string, shortName: string, count: number, partyLogoUrl?: string }[];
  };
  multiConstituencyCandidates?: MultiConstituencyCandidate[];
  starCandidates: ElectionInsightCandidate[];
  authorFocusCandidates: ElectionInsightCandidate[];
}

export interface MultiConstituencyCandidate {
  personId: string;
  name: string;
  partyName?: string;
  constituencies: string[];
  count: number;
  partyLogoUrl?: string | null;
}


export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface DashboardFilterOptions {
  parties: FilterOption[];
  districts: FilterOption[];
  constituencies: FilterOption[];
  education: FilterOption[];
  genders: FilterOption[];
  ageBands: FilterOption[];
  assetBands: FilterOption[];
  hasCriminalCases: FilterOption[];
  contestTypes: FilterOption[];
}

export interface PreElectionDashboardPayload {
  stats: PreElectionSnapshotStats;
  candidates: DashboardCandidate[];
  contests: ContestCard[];
  partyRollout: PartyRolloutSummary[];
  insights: DashboardInsights;
  filters: DashboardFilterOptions;
}

export type OverlayCandidate = DashboardCandidate;

export interface ConstituencyPreElectionOverlayData {
  constituencyId: string;
  constituencyName: string;
  districtName?: string;
  has2026Candidates: boolean;
  overlayStatus: 'live' | 'upcoming';
  candidateCount: number;
  currentMLA?: {
    name: string;
    party?: string;
    partyShort?: string;
    logoUrl?: string | null;
  } | null;
  lastElection?: {
    year: number;
    winner?: string | null;
    party?: string | null;
    partyShort?: string | null;
    margin?: number | null;
    totalVotes?: number | null;
  } | null;
  contestSummary?: {
    isOpenSeat: boolean;
    isIncumbentRecontest: boolean;
    candidateCount: number;
    majorPartyCount?: number;
    tags: string[];
  };
  candidates: OverlayCandidate[];
  insights: {
    ownCount: number;
    crossCount: number;
    newcomerCount: number;
    incumbentCount: number;
    majorParties: string[];
  };
}

export type { 
  PreElectionSnapshotStats, 
  PartyRolloutSummary, 
  ContestCard, 
  DashboardCandidate,
  ElectionInsightCandidate
} from "@/types/pre-election";
