export interface PriorElectionHistory {
  year?: number;
  won?: boolean;
  totalVotes?: number | null;
  winningMargin?: number | null;
  marginPercentage?: number | null;
}

export interface DashboardCandidate {
  id: string;
  personId?: string;
  name: string;
  slug?: string;
  constituencyId: string;
  constituencyName: string;
  districtId?: string;
  districtName?: string;
  partyId?: string;
  partyName?: string;
  partyShortName?: string;
  partyLogoUrl?: string | null;
  partyColorBg?: string | null;
  partyColorText?: string | null;
  partyColorBorder?: string | null;
  allianceName?: string | null;
  status: 'announced' | 'confirmed' | 'expected' | 'replaced' | 'withdrawn';
  isIncumbent?: boolean;
  isNewcomer?: boolean;
  gender?: string | null;
  age?: number | null;
  education?: string | null;
  profession?: string | null;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  criminalCases?: number | null;
  priorOffice?: string | null;
  priorElection?: PriorElectionHistory | null;
  profilePic?: string | null;
  isContestingOwnConstituency?: boolean | null;
  constituencyContestType?: 'own_constituency' | 'cross_constituency' | 'unknown';
}

export interface ContestCard {
  constituencyId: string;
  constituencyName: string;
  districtId?: string;
  districtName?: string;
  currentMLA?: string | null;
  currentMLAParty?: string | null;
  currentMLAPartyShort?: string | null;
  lastWinner?: string | null;
  lastWinnerParty?: string | null;
  lastWinnerPartyShort?: string | null;
  lastMargin?: number | null;
  isOpenSeat: boolean;
  isIncumbentRecontest: boolean;
  candidateCount: number;
  candidates: DashboardCandidate[];
  tags: string[];
  ownConstituencyCount?: number;
  crossConstituencyCount?: number;
}

export interface PartyRolloutSummary {
  partyId: string;
  partyName: string;
  shortName: string;
  logoUrl?: string | null;
  colorBg?: string | null;
  colorText?: string | null;
  colorBorder?: string | null;
  candidatesAnnounced: number;
  incumbentsRetained: number;
  newcomersFielded: number;
  averageAssets: number | null;
  totalCriminalCases: number | null;
  womenCandidatePercentage: number | null;
  ownConstituencyPercent?: number | null;
  crossConstituencyPercent?: number | null;
}

export interface ElectionInsightCandidate {
  name: string;
  party: string;
  constituencyName: string;
  value: number | string;
  formattedValue: string;
  partyLogoUrl?: string | null;
  profilePic?: string | null;
  personId?: string | null;
}

export interface PreElectionInsights {
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
    topCrossParties: { partyName: string, count: number, partyLogoUrl?: string }[];
  };
}

export interface PreElectionSnapshotStats {
  totalConstituencies: number;
  totalCandidatesAnnounced: number;
  partiesWithCandidates: number;
  seatsWithAnnouncedCandidates: number;
  incumbentsRecontestingPercent: number | null;
  openSeatsPercent: number | null;
  womenCandidatesPercent: number | null;
  averageCandidateAge: number | null;
  averageAssets: number | null;
  ownConstituencyPercent?: number | null;
  crossConstituencyPercent?: number | null;
}

export interface PreElectionDashboardData {
  summary: {
    stateName: string;
    electionYear: number;
    title: string;
    description: string;
  };
  stats: PreElectionSnapshotStats;
  partyRollout: PartyRolloutSummary[];
  constituencyContests: ContestCard[];
  candidates: DashboardCandidate[];
  insights: PreElectionInsights;
  faq: { question: string; answer: string }[];
}
