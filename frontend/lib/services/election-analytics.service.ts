import { MLARepository } from "../repositories/mla.repository";
import { PartyRepository } from "../repositories/party.repository";
import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PersonRepository } from "../repositories/person.repository";
import { DistrictRepository } from "../repositories/district.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { PollingResultRepository, ACSummary } from "../repositories/polling-result.repository";
import { getPartyLogo } from "../utils/party-utils";
import { normalizeTotalAssets } from "../utils/profile-normalizers";
import { normalizeCandidateProfilePic } from "../utils/profile-pic.utils";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export interface ElectionSummary {
  year: number;
  stateName: string;
  totalSeats: number;
  majorityMark: number;
  winningParty: string;
  winningPartyShort?: string;
  winningPartyLogoUrl?: string;
  winningPartyColorBg?: string;
  winningPartyColorText?: string;
  winningPartyColorBorder?: string;
  winningAlliance?: string;
  turnoutPercentage?: number;
  totalPartiesContested?: number;
  totalCandidates?: number;
  summarySentence: string;
}

export interface PartySeatShare {
  name: string;
  shortName: string;
  seatsWon: number;
  seatPercentage: number;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
  logoUrl?: string;
}

export interface PartyVoteShare {
  name: string;
  shortName: string;
  voteSharePercent: number;
  totalVotes?: number;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
}

export interface ConstituencyResult {
  constituencyId: string;
  constituencyName: string;
  districtName?: string;
  winnerName: string;
  winnerParty: string;
  winnerPartyShort: string;
  winnerVotes?: number;
  winnerVotePercent?: number;
  winnerPartyColorBg?: string;
  winnerPartyColorText?: string;
  winnerPartyColorBorder?: string;
  winnerPartyLogoUrl?: string;
  runnerUpName: string;
  runnerUpParty: string;
  runnerUpPartyShort: string;
  runnerUpVotes?: number;
  runnerUpVotePercent?: number;
  runnerUpPartyColorBg?: string;
  runnerUpPartyColorText?: string;
  runnerUpPartyColorBorder?: string;
  runnerUpPartyLogoUrl?: string;
  margin: number;
  turnoutPercent?: number;
  winnerPersonId?: string;
  runnerUpPersonId?: string;
  winnerPartyId?: string;
  runnerUpPartyId?: string;
  candidateCount?: number;
}

export interface CandidateResultRow {
  rank: number;
  name: string;
  party: string;
  partyShort: string;
  votes: number;
  voteShare: number;
  isWinner: boolean;
  partyColorBg?: string;
  partyColorText?: string;
  partyColorBorder?: string;
  partyLogoUrl?: string;
  profilePic?: string | null;
  personId?: string;
}

export interface ConstituencyElectionResult {
  constituencyId: string;
  constituencyName: string;
  districtName: string;
  year: number;
  totalElectors?: number;
  totalVotesPolled?: number;
  turnoutPercent?: number;
  validVotes?: number;
  winner: CandidateResultRow;
  runnerUp?: CandidateResultRow;
  margin: number;
  totalCandidates: number;
  candidates: CandidateResultRow[];
  summarySentence: string;
}

export interface DistrictStrength {
  districtName: string;
  leadParty: string;
  leadPartyShort: string;
  seatsWon: number;
  totalSeats: number;
  winPercentage: number;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
  leadPartyLogoUrl?: string;
  leadPartyId: string;
}

export interface CandidateInsight {
  name: string;
  party: string;
  partyShort: string;
  constituencyName: string;
  constituencyId: string;
  districtName: string;
  value: number | string;
  formattedValue: string;
  isWinner: boolean;
  partyColorBg?: string;
  partyColorText?: string;
  partyColorBorder?: string;
  partyLogoUrl?: string;
  profilePic?: string | null;
  personId?: string;
  partyId: string;
}

export interface ConversionMetric {
  partyName: string;
  partyShort: string;
  voteShare: number;
  seatShare: number;
  seatsWon: number;
  efficiency: 'over' | 'under' | 'neutral';
  colorBg?: string;
  colorBorder?: string;
}

export interface DepositLostPartyStats {
  partyName: string;
  partyShort: string;
  seatsContested: number;
  districtsWon: number;
  secondPlaces: number;
  thirdPlaces: number;
  depositLostCount: number;
  depositSavedCount: number;
  depositLossPercentage: number;
  partyColorBg?: string;
  partyColorText?: string;
  partyColorBorder?: string;
  partyLogoUrl?: string;
  partyId: string;
}

export interface WomenRepresentation {
  totalCandidates: number;
  totalWinners: number;
  winRate: number;
  contestantPercentage: number;
  winners: CandidateInsight[];
}

export interface ElectionInsights {
  closestContests: ConstituencyResult[];
  biggestVictories: ConstituencyResult[];
  strongestDistricts: DistrictStrength[];
  richestContestants: CandidateInsight[];
  youngestContestants: CandidateInsight[];
  highestTurnout: ConstituencyResult[];
  lowestTurnout: ConstituencyResult[];
  mostCrowdedContests: ConstituencyResult[];
  leastCrowdedContests: ConstituencyResult[];
  womenRepresentation: WomenRepresentation;
  depositLostAnalysis: DepositLostPartyStats[];
}

export interface ElectionPageData {
  summary: ElectionSummary;
  seatsByParty: PartySeatShare[];
  voteShareByParty: PartyVoteShare[];
  constituencyResults: ConstituencyResult[];
  insights: ElectionInsights;
  faq: { question: string; answer: string }[];
}

export interface PollingStationCandidateResult {
  candidateId: string;
  name: string;
  party: string;
  partyShort: string;
  votes: number;
  voteShare: number;
  contributionPercent: number;
  isWinner: boolean;
  partyColorBg?: string;
  partyColorText?: string;
  partyColorBorder?: string;
  partyLogoUrl?: string;
  profilePic?: string | null;
}

export interface PollingStationAnalysis {
  pollingStationNo: string;
  winnerCandidateId: string;
  winnerName: string;
  winnerVotes: number;
  winnerVoteShare: number;
  marginVotes: number;
  marginPercentage: number;
  boothType: 'STRONGHOLD' | 'SWING' | 'MULTI_CORNERED' | 'NOTA_HEAVY' | 'LOW_TURNOUT' | 'HIGH_TURNOUT' | 'NORMAL';
  turnoutPercentage: number;
  totalVotes: number;
  validVotes: number;
  notaVotes: number;
  notaPercentage: number;
  candidateResults: PollingStationCandidateResult[];
  strongholdTag?: string;
  insights: string[];
  pollingStationName?: string;
  electors?: number;
}


export interface PostalVotes {
  votes: Record<string, number>;
  valid: number;
  rej: number;
  nota: number;
  total: number;
}

export interface ConstituencyPollingData {
  constituencyId: string;
  constituencyName: string;
  districtName: string;
  year: number;
  totalPollingStations: number;
  avgTurnout: number;
  summary: {
    highestTurnoutBooth: string;
    lowestTurnoutBooth: string;
    closestContestBooth: string;
    highestMarginBooth: string;
    highestNotaBooth: string;
    candidateStrongestBooths: Record<string, { boothNo: string; share: number; candidateName: string }>;
  };
  pollingStations: PollingStationAnalysis[];
  acSummary?: ACSummary;
}

export class ElectionAnalyticsService {
  private mlaRepo: MLARepository;
  private partyRepo: PartyRepository;
  private constituencyRepo: ConstituencyRepository;
  private personRepo: PersonRepository;
  private districtRepo: DistrictRepository;
  private candidateRepo: CandidateRepository;
  private pollingRepo: PollingResultRepository;

  constructor(
    mlaRepo?: MLARepository,
    partyRepo?: PartyRepository,
    constituencyRepo?: ConstituencyRepository,
    personRepo?: PersonRepository
  ) {
    this.mlaRepo = mlaRepo || new MLARepository();
    this.partyRepo = partyRepo || new PartyRepository();
    this.constituencyRepo = constituencyRepo || new ConstituencyRepository();
    this.personRepo = personRepo || new PersonRepository();
    this.districtRepo = new DistrictRepository();
    this.candidateRepo = new CandidateRepository();
    this.pollingRepo = new PollingResultRepository();
  }


  async getElectionOverview(year: number): Promise<ElectionPageData | null> {
    return unstable_cache(
      async (yr: number): Promise<ElectionPageData | null> => {
        const year = yr;
        const [allCandidates, allParties, constituencies, districts] = await Promise.all([
          this.mlaRepo.getAllCandidatesByYear(year),
          this.partyRepo.getAllParties(),
          this.constituencyRepo.getAllConstituencies(),
          this.districtRepo.getAllDistricts()
        ]);

        if (!allCandidates || allCandidates.length === 0) return null;

        // Filter winners and ensure they belong to official constituencies
        const officialConstituencyIds = new Set(constituencies.map((c: any) => c.PK));
        const validWinners = allCandidates.filter((c: any) => c.is_winner && officialConstituencyIds.has(c.constituency_id));

        if (validWinners.length === 0 && constituencies.length === 0) return null;

        // Build lookup maps
        const partyMap = new Map(allParties.map((p: any) => [p.PK, p]));
        const districtMap = new Map(districts.map((d: any) => [d.PK, d.name]));
        const candidatesByConstituency = new Map<string, any[]>();

        // Fetch person metadata for all candidates to get gender information
        const uniquePersonIds = Array.from(new Set(allCandidates.filter(c => c.person_id).map(c => c.person_id)));
        const persons = await this.personRepo.getPersonsByIds(uniquePersonIds);
        const personMap = new Map(persons.map((p: any) => [p.PK, p]));

        allCandidates.forEach((c: any) => {
          const cid = c.constituency_id?.toUpperCase();
          if (!cid) return;

          if (!candidatesByConstituency.has(cid)) {
            candidatesByConstituency.set(cid, []);
          }
          candidatesByConstituency.get(cid)?.push(c);
        });

        // 1. Seats by Party (using validWinners only)
        const seatCounts: Record<string, number> = {};
        validWinners.forEach((w: any) => {
          const partyId = w.party_id;
          seatCounts[partyId] = (seatCounts[partyId] || 0) + 1;
        });

        const seatsByParty: PartySeatShare[] = Object.entries(seatCounts)
          .map(([partyId, count]) => {
            const party = partyMap.get(partyId);
            const shortName = party?.short_name || partyId.replace("PARTY#", "");
            return {
              name: party?.name || shortName,
              shortName: shortName,
              seatsWon: count,
              seatPercentage: (count / (validWinners.length || 234)) * 100,
              colorBg: party?.color_bg,
              colorText: party?.color_text,
              colorBorder: party?.color_border,
              logoUrl: getPartyLogo(shortName) || party?.logo_url
            };
          })
          .sort((a: PartySeatShare, b: PartySeatShare) => b.seatsWon - a.seatsWon);

        // Winning party logic
        const winningParty = seatsByParty[0] || { name: "N/A", seatsWon: 0 };

        // 2. Vote Share by Party
        const yearStr = year.toString();
        const voteShareByParty: PartyVoteShare[] = allParties
          .filter((p: any) => p.vote_share?.assembly?.[yearStr])
          .map((p: any) => {
            const stats = p.vote_share.assembly[yearStr];
            return {
              name: p.name,
              shortName: p.short_name || p.PK.replace("PARTY#", ""),
              voteSharePercent: stats.vote_share_percent,
              totalVotes: stats.votes,
              colorBg: p.color_bg,
              colorText: p.color_text,
              colorBorder: p.color_border
            };
          })
          .filter(p => {
            const name = (p.name || "").toLowerCase();
            const shortName = (p.shortName || "").toLowerCase();
            return name !== "independent" && shortName !== "ind";
          })
          .sort((a: PartyVoteShare, b: PartyVoteShare) => b.voteSharePercent - a.voteSharePercent);

        // Create Constituency Map for O(1) lookups later
        const constituencyMap = new Map(constituencies.map((c: any) => [c.PK, c]));

        // 3. Constituency Results (Mapped and filtered by official list)
        const constituencyResults: ConstituencyResult[] = constituencies.map((constituency: any) => {
          const cid = constituency.PK;
          const cidKey = cid.toUpperCase();
          const candidates = candidatesByConstituency.get(cidKey) || [];

          // Sort candidates by votes to find winner and runner-up
          const sorted = [...candidates].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));

          const winner = sorted[0] || { candidate_name: "N/A", party_id: "" };
          const runnerUp = sorted[1] || { candidate_name: "N/A", party_id: "" };

          const winnerParty = partyMap.get(winner.party_id);
          const runnerUpParty = partyMap.get(runnerUp.party_id);

          // Extract turnout from statistics within the metadata
          const turnoutFromMetadata = constituency.statistics?.[yearStr]?.poll_percentage;

          // District resolution logic
          const districtId = constituency?.district_id || winner.district_id;
          const districtName = districtMap.get(districtId) || constituency?.district_name || constituency?.district || winner.district_name || "N/A";

          return {
            constituencyId: cid?.replace("CONSTITUENCY#", ""),
            constituencyName: constituency?.name || winner.candidate_name || "Unknown",
            districtName: districtName,
            winnerName: winner.candidate_name || "N/A",
            winnerParty: winnerParty?.name || winnerParty?.short_name || winner.party_id?.replace("PARTY#", "") || "N/A",
            winnerPartyShort: winnerParty?.short_name || winner.party_id?.replace("PARTY#", "") || "N/A",
            winnerVotes: winner.total_votes,
            winnerVotePercent: winner.vote_percent,
            winnerPartyColorBg: winnerParty?.color_bg,
            winnerPartyColorText: winnerParty?.color_text,
            winnerPartyColorBorder: winnerParty?.color_border,
            winnerPartyLogoUrl: getPartyLogo(winnerParty?.short_name) || winnerParty?.logo_url,
            runnerUpName: runnerUp.candidate_name || "N/A",
            runnerUpParty: runnerUpParty?.name || runnerUpParty?.short_name || runnerUp.party_id?.replace("PARTY#", "") || "N/A",
            runnerUpPartyShort: runnerUpParty?.short_name || runnerUp.party_id?.replace("PARTY#", "") || "N/A",
            runnerUpVotes: runnerUp.total_votes,
            runnerUpVotePercent: runnerUp.vote_percent,
            runnerUpPartyColorBg: runnerUpParty?.color_bg,
            runnerUpPartyColorText: runnerUpParty?.color_text,
            runnerUpPartyColorBorder: runnerUpParty?.color_border,
            runnerUpPartyLogoUrl: getPartyLogo(runnerUpParty?.short_name) || runnerUpParty?.logo_url,
            margin: Math.max(0, (winner.total_votes || 0) - (runnerUp.total_votes || 0)),
            turnoutPercent: turnoutFromMetadata || winner.turnout_percent,
            winnerPersonId: winner.person_id?.replace("PERSON#", ""),
            runnerUpPersonId: runnerUp.person_id?.replace("PERSON#", ""),
            winnerPartyId: winner.party_id?.replace("PARTY#", ""),
            runnerUpPartyId: runnerUp.party_id?.replace("PARTY#", ""),
            candidateCount: candidates.length
          };
        }).sort((a, b) => a.constituencyName.localeCompare(b.constituencyName));

        // 4. Election Insights
        // 4.1 Closest Contests
        const closestContests = [...constituencyResults]
          .filter(r => r.margin > 0)
          .sort((a, b) => a.margin - b.margin)
          .slice(0, 10);

        // 4.2 Biggest Victories
        const biggestVictories = [...constituencyResults]
          .filter(r => r.margin > 0)
          .sort((a, b) => b.margin - a.margin)
          .slice(0, 10);

        // 4.3 Strongest Districts
        const districtStats: Record<string, { seats: number; partyWins: Record<string, { count: number; short: string; color: string; border: string; text: string; logo: string; id: string }> }> = {};
        constituencyResults.forEach(r => {
          if (!r.districtName) return;
          if (!districtStats[r.districtName]) {
            districtStats[r.districtName] = { seats: 0, partyWins: {} };
          }
          districtStats[r.districtName].seats += 1;
          const pId = r.winnerPartyId || r.winnerParty;
          if (!districtStats[r.districtName].partyWins[pId]) {
            districtStats[r.districtName].partyWins[pId] = {
              count: 0,
              short: r.winnerPartyShort,
              color: r.winnerPartyColorBg || '#164C45',
              border: r.winnerPartyColorBorder || '#164C45',
              text: r.winnerPartyColorText || '#ffffff',
              logo: getPartyLogo(r.winnerPartyShort) || r.winnerPartyLogoUrl || '',
              id: pId
            };
          }
          districtStats[r.districtName].partyWins[pId].count += 1;
        });

        const strongestDistricts: DistrictStrength[] = Object.entries(districtStats)
          .map(([dName, stats]) => {
            const leadEntry = Object.entries(stats.partyWins).sort((a, b) => b[1].count - a[1].count)[0];
            return {
              districtName: dName,
              leadParty: leadEntry[0],
              leadPartyShort: leadEntry[1].short,
              seatsWon: leadEntry[1].count,
              totalSeats: stats.seats,
              winPercentage: (leadEntry[1].count / stats.seats) * 100,
              colorBg: leadEntry[1].color,
              colorText: leadEntry[1].text,
              colorBorder: leadEntry[1].border,
              leadPartyLogoUrl: leadEntry[1].logo,
              leadPartyId: leadEntry[0]
            };
          })
          .sort((a, b) => b.winPercentage - a.winPercentage)
          .slice(0, 8);

        // 4.4 Richest Contestants
        const formatAssets = (val: any) => {
          const num = Number(val);
          if (isNaN(num) || num === 0) return "N/A";
          if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
          if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
          return num.toLocaleString();
        };

        const richestContestants: CandidateInsight[] = allCandidates
          .map(c => ({ ...c, normalizedAssets: normalizeTotalAssets(c.total_assets) }))
          .filter(c => c.normalizedAssets > 0)
          .sort((a, b) => b.normalizedAssets - a.normalizedAssets)
          .slice(0, 100)
          .map(c => {
            const party = partyMap.get(c.party_id);
            const constituency = constituencyMap.get(c.constituency_id);
            return {
              name: c.candidate_name,
              party: party?.name || c.party_id?.replace("PARTY#", ""),
              partyShort: party?.short_name || c.party_id?.replace("PARTY#", ""),
              constituencyName: constituency?.name || c.constituency_name || "N/A",
              constituencyId: c.constituency_id?.replace("CONSTITUENCY#", ""),
              districtName: districtMap.get(c.district_id) || "N/A",
              value: c.normalizedAssets,
              formattedValue: formatAssets(c.normalizedAssets),
              isWinner: !!c.is_winner,
              partyColorBg: party?.color_bg,
              partyColorText: party?.color_text,
              partyColorBorder: party?.color_border,
              partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
              profilePic: normalizeCandidateProfilePic(c.profile_pic),
              personId: c.person_id?.replace("PERSON#", ""),
              partyId: c.party_id?.replace("PARTY#", "")
            };
          });

        // 4.5 Youngest Contestants
        const youngestContestants: CandidateInsight[] = allCandidates
          .filter(c => c.age && Number(c.age) > 0 && Number(c.age) < 100)
          .sort((a, b) => Number(a.age) - Number(b.age))
          .slice(0, 100)
          .map(c => {
            const party = partyMap.get(c.party_id);
            const constituency = constituencyMap.get(c.constituency_id);
            return {
              name: c.candidate_name,
              party: party?.name || c.party_id?.replace("PARTY#", ""),
              partyShort: party?.short_name || c.party_id?.replace("PARTY#", ""),
              constituencyName: constituency?.name || c.constituency_name || "N/A",
              constituencyId: c.constituency_id?.replace("CONSTITUENCY#", ""),
              districtName: districtMap.get(c.district_id) || "N/A",
              value: Number(c.age),
              formattedValue: `${c.age} Yrs`,
              isWinner: !!c.is_winner,
              partyColorBg: party?.color_bg,
              partyColorText: party?.color_text,
              partyColorBorder: party?.color_border,
              partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
              profilePic: normalizeCandidateProfilePic(c.profile_pic),
              personId: c.person_id?.replace("PERSON#", ""),
              partyId: c.party_id?.replace("PARTY#", "")
            };
          });

        // 4.6 Highest Turnout
        const highestTurnout = [...constituencyResults]
          .filter(r => r.turnoutPercent && r.turnoutPercent > 0)
          .sort((a, b) => (b.turnoutPercent || 0) - (a.turnoutPercent || 0))
          .slice(0, 10);

        // 4.7 Lowest Turnout
        const lowestTurnout = [...constituencyResults]
          .filter(r => r.turnoutPercent && r.turnoutPercent > 0)
          .sort((a, b) => (a.turnoutPercent || 0) - (b.turnoutPercent || 0))
          .slice(0, 10);

        // 4.8 Most Crowded Contests
        const mostCrowdedContests = [...constituencyResults]
          .filter(r => r.candidateCount && r.candidateCount > 0)
          .sort((a, b) => (b.candidateCount || 0) - (a.candidateCount || 0))
          .slice(0, 10);

        // 4.9 Least Crowded Contests
        const leastCrowdedContests = [...constituencyResults]
          .filter(r => r.candidateCount && r.candidateCount > 0)
          .sort((a, b) => (a.candidateCount || 0) - (b.candidateCount || 0))
          .slice(0, 10);

        // 4.10 Women Representation
        const womenCandidates = allCandidates.filter((c: any) => {
          const person = personMap.get(c.person_id);
          const sex = person?.sex?.toUpperCase() || c.sex?.toUpperCase();
          return sex === 'F' || sex === 'FEMALE';
        });

        const womenWinners = womenCandidates
          .filter((c: any) => c.is_winner && officialConstituencyIds.has(c.constituency_id))
          .map((c: any) => {
            const party = partyMap.get(c.party_id);
            const cid = c.constituency_id;
            const constituency = constituencyMap.get(cid);
            const districtId = constituency?.district_id || c.district_id;
            const districtName = districtMap.get(districtId) || "N/A";

            return {
              name: c.candidate_name,
              party: party?.name || c.party_id?.replace("PARTY#", ""),
              partyShort: party?.short_name || c.party_id?.replace("PARTY#", ""),
              constituencyName: constituency?.name || c.constituency_name || "Unknown",
              constituencyId: cid?.replace("CONSTITUENCY#", ""),
              districtName: districtName,
              value: c.winning_margin || 0,
              formattedValue: `+${(c.winning_margin || 0).toLocaleString()}`,
              isWinner: true,
              partyColorBg: party?.color_bg,
              partyColorText: party?.color_text,
              partyColorBorder: party?.color_border,
              partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
              profilePic: normalizeCandidateProfilePic(c.profile_pic),
              personId: c.person_id?.replace("PERSON#", ""),
              partyId: c.party_id?.replace("PARTY#", "")
            };
          })
          .sort((a, b) => (b.value as number) - (a.value as number));

        const womenRepresentation: WomenRepresentation = {
          totalCandidates: womenCandidates.length,
          totalWinners: womenWinners.length,
          winRate: womenCandidates.length > 0 ? (womenWinners.length / womenCandidates.length) * 100 : 0,
          contestantPercentage: allCandidates.length > 0 ? (womenCandidates.length / allCandidates.length) * 100 : 0,
          winners: womenWinners
        };

        // 4.11 Deposit Lost Analysis
        const partyStatsMap = new Map<string, DepositLostPartyStats>();

        allCandidates.forEach((c: any) => {
          const party = partyMap.get(c.party_id);
          const partyName = party?.name?.toLowerCase() || c.party_id?.replace("PARTY#", "").toLowerCase();
          const shortName = party?.short_name?.toLowerCase() || c.party_id?.replace("PARTY#", "").toLowerCase();

          if (partyName === "independent" || shortName === "ind" || partyName === "none of the above" || shortName === "nota") return;

          const pId = c.party_id || "UNKNOWN";
          if (!partyStatsMap.has(pId)) {
            partyStatsMap.set(pId, {
              partyName: party?.name || pId.replace("PARTY#", ""),
              partyShort: party?.short_name || pId.replace("PARTY#", ""),
              seatsContested: 0,
              districtsWon: 0,
              secondPlaces: 0,
              thirdPlaces: 0,
              depositLostCount: 0,
              depositSavedCount: 0,
              depositLossPercentage: 0,
              partyColorBg: party?.color_bg,
              partyColorText: party?.color_text,
              partyColorBorder: party?.color_border,
              partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
              partyId: pId
            });
          }

          const stats = partyStatsMap.get(pId)!;
          stats.seatsContested++;

          if (c.deposit_lost === true || c.deposit_lost === "true" || c.deposit_lost === 1) {
            stats.depositLostCount++;
          } else {
            stats.depositSavedCount++;
          }
        });

        const districtWinsByParty = new Map<string, Set<string>>();

        // Calculate 2nd and 3rd places by iterating over constituency results
        constituencies.forEach((constituency: any) => {
            const cid = constituency.PK.toUpperCase();
            const candidates = candidatesByConstituency.get(cid) || [];
            
            // Sort by votes
            const sorted = [...candidates].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
            
            // Track 2nd place
            if (sorted[1]) {
                const pId = sorted[1].party_id;
                if (pId && partyStatsMap.has(pId)) {
                    partyStatsMap.get(pId)!.secondPlaces++;
                }
            }

            // Track 3rd place
            if (sorted[2]) {
                const pId = sorted[2].party_id;
                if (pId && partyStatsMap.has(pId)) {
                    partyStatsMap.get(pId)!.thirdPlaces++;
                }
            }

            // Track districts won
            if (sorted[0] && sorted[0].is_winner) {
                const winner = sorted[0];
                const pId = winner.party_id;
                if (pId && partyStatsMap.has(pId)) {
                    const districtId = constituency?.district_id || winner.district_id;
                    if (districtId) {
                        if (!districtWinsByParty.has(pId)) {
                            districtWinsByParty.set(pId, new Set<string>());
                        }
                        districtWinsByParty.get(pId)!.add(districtId);
                    }
                }
            }
        });

        // Set districtsWon for each party
        for (const [pId, districts] of districtWinsByParty.entries()) {
            if (partyStatsMap.has(pId)) {
                partyStatsMap.get(pId)!.districtsWon = districts.size;
            }
        }

        const depositLostAnalysis = Array.from(partyStatsMap.values())
          .map(s => {
            s.depositLossPercentage = s.seatsContested > 0 ? (s.depositLostCount / s.seatsContested) * 100 : 0;
            return s;
          })
          .sort((a, b) => {
            if (b.depositLostCount !== a.depositLostCount) {
              return b.depositLostCount - a.depositLostCount;
            }
            return b.depositLossPercentage - a.depositLossPercentage;
          });

        const insights: ElectionInsights = {
          closestContests,
          biggestVictories,
          strongestDistricts,
          richestContestants,
          youngestContestants,
          highestTurnout,
          lowestTurnout,
          mostCrowdedContests,
          leastCrowdedContests,
          womenRepresentation,
          depositLostAnalysis
        };

        // 5. Summary
        const totalSeats = 234; // For TN, should generalize if needed
        const majorityMark = Math.floor(totalSeats / 2) + 1;

        const summary: ElectionSummary = {
          year,
          stateName: "Tamil Nadu",
          totalSeats,
          majorityMark,
          winningParty: winningParty.name,
          winningPartyShort: (winningParty as any).shortName,
          winningPartyLogoUrl: getPartyLogo((winningParty as any).shortName) || (winningParty as any).logoUrl,
          winningPartyColorBg: (winningParty as any).colorBg,
          winningPartyColorText: (winningParty as any).colorText,
          winningPartyColorBorder: (winningParty as any).colorBorder,
          totalPartiesContested: voteShareByParty.length,
          totalCandidates: allCandidates.length,
          summarySentence: `${winningParty.name} emerged as the leading party in the ${year} Tamil Nadu Assembly election, winning ${winningParty.seatsWon} seats and forming the government.`
        };

        // 5. FAQ
        const faq = [
          {
            question: `Who won the Tamil Nadu Assembly Election ${year}?`,
            answer: `${winningParty.name} won the election with ${winningParty.seatsWon} seats.`
          },
          {
            question: `How many seats did the winning party get?`,
            answer: `${winningParty.name} secured ${winningParty.seatsWon} seats out of ${totalSeats}.`
          },
          {
            question: `What was the majority mark in the ${year} election?`,
            answer: `The majority mark for the Tamil Nadu Legislative Assembly is ${majorityMark} seats.`
          }
        ];

        if (voteShareByParty.length > 0) {
          faq.push({
            question: `Which party had the highest vote share?`,
            answer: `${voteShareByParty[0].name} had the highest vote share of ${voteShareByParty[0].voteSharePercent}%.`
          });
        }

        return {
          summary,
          seatsByParty,
          voteShareByParty,
          constituencyResults,
          insights,
          faq
        };
      },
      ["election-overview", year.toString()],
      { revalidate: 86400, tags: [`election-overview-${year}`] }
    )(year);
  }

  async getConstituencyElectionResult(constituencyId: string, year: number): Promise<ConstituencyElectionResult | null> {
    return unstable_cache(
      async (cId: string, yr: number): Promise<ConstituencyElectionResult | null> => {
        const constituencyId = cId;
        const year = yr;
        const cid = constituencyId.startsWith("CONSTITUENCY#") ? constituencyId : `CONSTITUENCY#${constituencyId}`;

        const [constituency, candidates, allParties, districts] = await Promise.all([
          this.constituencyRepo.getConstituencyMetadata(cid),
          this.candidateRepo.getCandidatesByConstituencyAndYear(cid, year),
          this.partyRepo.getAllParties(),
          this.districtRepo.getAllDistricts()
        ]);

        if (!constituency || !candidates || candidates.length === 0) return null;

        const partyMap = new Map(allParties.map((p: any) => [p.PK, p]));
        const districtMap = new Map(districts.map((d: any) => [d.PK, d.name]));

        const yearStr = year.toString();
        const stats = constituency.statistics?.[yearStr] || {};
        const totalVotesPolled = stats.total_votes_polled || 0;

        // Sort candidates by votes
        const sorted = [...candidates].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));

        // Build candidate rows
        const candidateRows: CandidateResultRow[] = sorted.map((c: any, index: number) => {
          const party = partyMap.get(c.party_id);
          const votes = c.total_votes || 0;

          // Calculate vote share if not explicitly provided
          let voteShare = c.vote_percent;
          if (!voteShare && totalVotesPolled > 0) {
            voteShare = (votes / totalVotesPolled) * 100;
          }

          return {
            rank: index + 1,
            name: c.candidate_name,
            party: party?.name || c.party_id?.replace("PARTY#", "") || "N/A",
            partyShort: party?.short_name || c.party_id?.replace("PARTY#", "") || "N/A",
            votes: votes,
            voteShare: voteShare || 0,
            isWinner: !!c.is_winner,
            partyColorBg: party?.color_bg,
            partyColorText: party?.color_text,
            partyColorBorder: party?.color_border,
            partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
            profilePic: normalizeCandidateProfilePic(c.profile_pic),
            personId: c.person_id?.replace("PERSON#", "")
          };
        });

        const winner = candidateRows[0];
        const runnerUp = candidateRows[1];
        const margin = Math.max(0, (winner.votes || 0) - (runnerUp?.votes || 0));
        const districtName = districtMap.get(constituency.district_id) || "N/A";

        const summarySentence = `${winner.name} of ${winner.partyShort} won the ${year} election in ${constituency.name} by a margin of ${margin.toLocaleString()} votes.`;

        return {
          constituencyId: cid.replace("CONSTITUENCY#", ""),
          constituencyName: constituency.name,
          districtName,
          year,
          totalElectors: stats.total_electors,
          totalVotesPolled: stats.total_votes_polled,
          turnoutPercent: stats.poll_percentage,
          winner,
          runnerUp,
          margin,
          totalCandidates: candidateRows.length,
          candidates: candidateRows,
          summarySentence
        };
      },
      ["constituency-election-result", constituencyId, year.toString()],
      { revalidate: 86400, tags: [`constituency-result-${constituencyId}-${year}`] }
    )(constituencyId, year);
  }

  getPollingStationResults = cache(async (constituencyId: string, year: number): Promise<ConstituencyPollingData | null> => {
    const cid = constituencyId.startsWith("CONSTITUENCY#") ? constituencyId : `CONSTITUENCY#${constituencyId}`;

    const [constituency, pollingResults, acSummary, allParties, candidates, districts, explicitPostalRecord] = await Promise.all([
          this.constituencyRepo.getConstituencyMetadata(cid),
          this.pollingRepo.getPollingResultsByConstituency(cid, year),
          this.pollingRepo.getACSummary(cid, year),
          this.partyRepo.getAllParties(),
          this.candidateRepo.getCandidatesByConstituencyAndYear(cid, year),
          this.districtRepo.getAllDistricts(),
          this.pollingRepo.getPostalVotes(cid, year)
        ]);

        if (!constituency || !pollingResults || pollingResults.length === 0) return null;

        const partyMap = new Map(allParties.map((p: any) => [p.PK, p]));
        const districtMap = new Map(districts.map((d: any) => [d.PK, d.name]));
        const candidateMap = new Map(candidates.map((c: any) => [c.PK, c]));

        const districtName = districtMap.get(constituency.district_id) || "N/A";
        const avgTurnout = acSummary?.poll_percentage || 0;

        // Extract Postal Votes from results if present
        const postalRecord = explicitPostalRecord || pollingResults.find(ps => ps.SK === 'POSTAL' && ps.year === year);
        const stations = pollingResults.filter(ps => ps.SK === 'METADATA' && ps.year === year);

        const analyzedStations: PollingStationAnalysis[] = stations.map(ps => {
          const resultsArray = Object.entries(ps.results)
            .filter(([id]) => id !== 'NOTA')
            .map(([id, stats]) => {
              const candidate = candidateMap.get(id);
              const party = candidate ? partyMap.get(candidate.party_id) : null;
              return {
                candidateId: id,
                name: candidate?.candidate_name || "Unknown",
                party: party?.name || "Independent",
                partyShort: party?.short_name || "IND",
                votes: stats.votes,
                voteShare: stats.vote_share_percentage,
                contributionPercent: stats.candidate_contribution_percentage,
                isWinner: false,
                partyColorBg: party?.color_bg,
                partyColorText: party?.color_text,
                partyColorBorder: party?.color_border,
                partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
                profilePic: normalizeCandidateProfilePic(candidate?.profile_pic),
              };
            })
            .sort((a, b) => b.votes - a.votes);

          if (resultsArray.length > 0) resultsArray[0].isWinner = true;

          const winner = resultsArray[0];
          const runnerUp = resultsArray[1];
          const marginVotes = winner && runnerUp ? winner.votes - runnerUp.votes : winner?.votes || 0;
          const marginPercentage = ps.valid_votes > 0 ? (marginVotes / ps.valid_votes) * 100 : 0;
          const notaPercentage = ps.valid_votes > 0 ? (ps.nota_votes / ps.valid_votes) * 100 : 0;

          const turnoutPercentage = ps.total_electors && ps.total_electors > 0
            ? (ps.total_votes_polled / ps.total_electors) * 100
            : null;

          // Classification Logic
          let boothType: PollingStationAnalysis['boothType'] = 'NORMAL';
          if (winner && winner.voteShare > 45) boothType = 'STRONGHOLD';
          else if (marginPercentage < 3) boothType = 'SWING';
          else if (resultsArray.length >= 3 && resultsArray[0].voteShare - resultsArray[2].voteShare < 10) boothType = 'MULTI_CORNERED';

          if (notaPercentage > 2) boothType = 'NOTA_HEAVY';
          if (turnoutPercentage !== null) {
            if (turnoutPercentage > avgTurnout + 5) boothType = 'HIGH_TURNOUT';
            if (turnoutPercentage < avgTurnout - 5) boothType = 'LOW_TURNOUT';
          }

          // Stronghold Tag
          let strongholdTag = '';
          if (winner && winner.voteShare > (avgTurnout > 0 ? avgTurnout + 10 : 45)) {
            strongholdTag = `${winner.partyShort} Stronghold`;
          }

          // Insights
          const insights: string[] = [];
          if (boothType === 'STRONGHOLD') insights.push(`${winner?.partyShort} dominated this booth with ${winner?.voteShare}% vote share.`);
          if (boothType === 'SWING') insights.push(`Close contest observed with a margin of only ${marginVotes} votes.`);
          if (notaPercentage > 2) insights.push(`High NOTA preference detected (${notaPercentage.toFixed(2)}%).`);

          return {
            pollingStationNo: ps.polling_station_no,
            winnerCandidateId: winner?.candidateId || "N/A",
            winnerName: winner?.name || "N/A",
            winnerVotes: winner?.votes || 0,
            winnerVoteShare: winner?.voteShare || 0,
            marginVotes,
            marginPercentage,
            boothType,
            turnoutPercentage: turnoutPercentage || 0.0,
            totalVotes: ps.total_votes_polled,
            validVotes: ps.valid_votes,
            notaVotes: ps.nota_votes,
            notaPercentage,
            candidateResults: resultsArray,
            strongholdTag,
            insights,
            pollingStationName: ps.ps_name || ps.polling_station_name || undefined,
            electors: ps.electors || ps.total_electors || undefined
          };

        });

        // Add Postal Votes as a special "Polling Station 0"
        if (postalRecord) {
          const postalResultsArray = Object.entries(postalRecord.results)
            .filter(([id]) => id !== 'NOTA')
            .map(([id, stats]) => {
              const candidate = candidateMap.get(id);
              const party = candidate ? partyMap.get(candidate.party_id) : null;
              return {
                candidateId: id,
                name: candidate?.candidate_name || "Unknown",
                party: party?.name || "Independent",
                partyShort: party?.short_name || "IND",
                votes: (stats as any).votes,
                voteShare: (stats as any).vote_share_percentage || 0,
                contributionPercent: (stats as any).candidate_contribution_percentage || 0,
                isWinner: false,
                partyColorBg: party?.color_bg,
                partyColorText: party?.color_text,
                partyColorBorder: party?.color_border,
                partyLogoUrl: getPartyLogo(party?.short_name) || party?.logo_url,
                profilePic: normalizeCandidateProfilePic(candidate?.profile_pic),
              };
            })
            .sort((a, b) => b.votes - a.votes);

          if (postalResultsArray.length > 0) postalResultsArray[0].isWinner = true;

          const pWinner = postalResultsArray[0];
          const pRunnerUp = postalResultsArray[1];
          const pMarginVotes = pWinner && pRunnerUp ? pWinner.votes - pRunnerUp.votes : pWinner?.votes || 0;
          const pTotalValid = (postalRecord.valid_votes || 0) + (postalRecord.nota_votes || 0);
          const pMarginPercentage = pTotalValid > 0 ? (pMarginVotes / pTotalValid) * 100 : 0;
          const pNotaPercentage = pTotalValid > 0 ? (postalRecord.nota_votes / pTotalValid) * 100 : 0;

          analyzedStations.push({
            pollingStationNo: 'POSTAL', // Using POSTAL for Postal Votes
            winnerCandidateId: pWinner?.candidateId || "N/A",
            winnerName: pWinner?.name || "N/A",
            winnerVotes: pWinner?.votes || 0,
            winnerVoteShare: pWinner?.voteShare || 0,
            marginVotes: pMarginVotes,
            marginPercentage: pMarginPercentage,
            boothType: 'NORMAL', // Postal votes usually don't get stronghold tags etc
            turnoutPercentage: 0,
            totalVotes: postalRecord.total_votes_polled,
            validVotes: postalRecord.valid_votes,
            notaVotes: postalRecord.nota_votes,
            notaPercentage: pNotaPercentage,
            candidateResults: postalResultsArray,
            strongholdTag: 'Postal Votes',
            insights: [`Results from ${postalRecord.total_votes_polled.toLocaleString()} postal ballots.`]
          });
        }

        analyzedStations.sort((a, b) => {
          const aVal = a.pollingStationNo === 'POSTAL' ? 0 : parseInt(a.pollingStationNo) || Number.MAX_SAFE_INTEGER;
          const bVal = b.pollingStationNo === 'POSTAL' ? 0 : parseInt(b.pollingStationNo) || Number.MAX_SAFE_INTEGER;
          return aVal - bVal;
        });

        // Summary Analytics
        const summary = {
          highestTurnoutBooth: [...analyzedStations].sort((a, b) => b.totalVotes - a.totalVotes)[0]?.pollingStationNo || '0',
          lowestTurnoutBooth: [...analyzedStations].sort((a, b) => a.totalVotes - b.totalVotes)[0]?.pollingStationNo || '0',
          closestContestBooth: [...analyzedStations].filter(s => s.marginVotes > 0).sort((a, b) => a.marginVotes - b.marginVotes)[0]?.pollingStationNo || '0',
          highestMarginBooth: [...analyzedStations].sort((a, b) => b.marginVotes - a.marginVotes)[0]?.pollingStationNo || '0',
          highestNotaBooth: [...analyzedStations].sort((a, b) => b.notaPercentage - a.notaPercentage)[0]?.pollingStationNo || '0',
          candidateStrongestBooths: {} as Record<string, { boothNo: string; share: number; candidateName: string }>
        };

        candidates.forEach(c => {
          const id = c.PK;
          const strongest = [...analyzedStations].sort((a, b) => {
            const shareA = a.candidateResults.find(r => r.candidateId === id)?.voteShare || 0;
            const shareB = b.candidateResults.find(r => r.candidateId === id)?.voteShare || 0;
            return shareB - shareA;
          })[0];

          if (strongest) {
            summary.candidateStrongestBooths[id] = {
              boothNo: strongest.pollingStationNo,
              share: strongest.candidateResults.find(r => r.candidateId === id)?.voteShare || 0,
              candidateName: c.candidate_name
            };
          }
        });

        return {
          constituencyId: cid.replace("CONSTITUENCY#", ""),
          constituencyName: constituency.name,
          districtName,
          year,
          totalPollingStations: analyzedStations.length,
          avgTurnout,
          summary,
          pollingStations: analyzedStations,
          acSummary: acSummary || undefined
        };
  });
}
