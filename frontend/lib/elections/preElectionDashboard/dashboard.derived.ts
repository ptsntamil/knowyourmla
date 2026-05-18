import { 
  DashboardCandidate, 
  ContestCard, 
  PartyRolloutSummary, 
  PreElectionSnapshotStats,
  DashboardInsights,
  ElectionInsightCandidate
} from "./dashboard.types";
import { TAG_THRESHOLD_CLOSE_MARGIN, VOTER_STATS_KEY } from "./dashboard.constants";
import { sortByPartyOrder, getPartyRank } from "./dashboard.utils";
import { 
  MultiConstituencyCandidate,
} from "./dashboard.types";
import { PREVIOUS_ELECTION_YEAR } from "@/lib/constants/elections";

/**
 * Builds constituency contest cards based on candidates and prior election data.
 */
export function buildContestCards(
  candidates: DashboardCandidate[],
  constituencies: any[],
  metadata: {
    districtMap: Map<string, string>;
    constituencyPriorWinners: Map<string, any>;
    partyMap: Map<string, any>;
  }
): ContestCard[] {
  const { districtMap, constituencyPriorWinners, partyMap } = metadata;
  const candidatesByConstituency = groupCandidatesByConstituency(candidates);

  return constituencies.map((con: any) => {
    const cid = con.PK;
    const cidShort = cid.replace("CONSTITUENCY#", "");
    const conCands = candidatesByConstituency.get(cidShort) || [];
    
    const priorWinner = constituencyPriorWinners.get(cid);
    
    // Robust party lookup: handle cases with or without prefix
    const getParty = (pid: string | undefined) => {
      if (!pid) return null;
      return partyMap.get(pid) || partyMap.get(`PARTY#${pid}`) || null;
    };

    const priorWinnerParty = priorWinner ? getParty(priorWinner.party_id) : null;
    
    const lastMargin = priorWinner?.winning_margin || null;
    const isIncumbentRecontest = conCands.some(c => c.isIncumbent);
    const isOpenSeat = !!priorWinner && !isIncumbentRecontest && conCands.length > 0;

    const ownCount = conCands.filter(c => c.constituencyContestType === 'own_constituency').length;
    const crossCount = conCands.filter(c => c.constituencyContestType === 'cross_constituency').length;

    const tags: string[] = [];
    if (isOpenSeat) tags.push("Open Seat");
    if (isIncumbentRecontest) tags.push("Incumbent Recontest");
    if (conCands.length >= 3) tags.push("Multi-Corner");
    if (lastMargin != null && lastMargin < TAG_THRESHOLD_CLOSE_MARGIN) tags.push(`Close Margin '${PREVIOUS_ELECTION_YEAR.slice(-2)}`);

    return {
      constituencyId: cidShort,
      constituencyName: con.name,
      districtId: con.district_id?.replace("DISTRICT#", ""),
      districtName: districtMap.get(con.district_id) || "N/A",
      currentMLA: priorWinner?.candidate_name || null,
      currentMLAParty: priorWinnerParty?.name || null,
      currentMLAPartyShort: priorWinnerParty?.short_name || priorWinner?.party_id?.replace("PARTY#", "") || null,
      lastWinner: priorWinner?.candidate_name || null,
      lastWinnerParty: priorWinnerParty?.name || null,
      lastWinnerPartyShort: priorWinnerParty?.short_name || priorWinner?.party_id?.replace("PARTY#", "") || "IND",
      lastMargin,
      isOpenSeat,
      isIncumbentRecontest,
      candidateCount: conCands.length,
      candidates: sortByPartyOrder(conCands, c => c.partyShortName),
      tags,
      ownConstituencyCount: ownCount,
      crossConstituencyCount: crossCount,
      lastWinnerPersonId: priorWinner?.ml_person_id || null,
      lastWinnerPartyColorBg: priorWinnerParty?.color_bg || null,
      lastWinnerPartyColorText: priorWinnerParty?.color_text || null,
      lastWinnerPartyColorBorder: priorWinnerParty?.color_border || null
    };
  }).sort((a, b) => {
    // Open seats first, then close margin (if we had a flag), then alpha
    if (a.isOpenSeat && !b.isOpenSeat) return -1;
    if (!a.isOpenSeat && b.isOpenSeat) return 1;
    return a.constituencyName.localeCompare(b.constituencyName);
  });
}

/**
 * Groups candidates by constituency ID.
 */
export function groupCandidatesByConstituency(candidates: DashboardCandidate[]): Map<string, DashboardCandidate[]> {
  const map = new Map<string, DashboardCandidate[]>();
  candidates.forEach(c => {
    if (!map.has(c.constituencyId)) map.set(c.constituencyId, []);
    map.get(c.constituencyId)!.push(c);
  });
  return map;
}

/**
 * Builds party rollout summary statistics.
 */
export function buildPartyRolloutSummary(candidates: DashboardCandidate[]): PartyRolloutSummary[] {
  const partyStatsMap = new Map<string, PartyRolloutSummary>();

  candidates.forEach(c => {
    if (!c.partyId) return;
    if (!partyStatsMap.has(c.partyId)) {
      partyStatsMap.set(c.partyId, {
        partyId: c.partyId,
        partyName: c.partyName || "Unknown",
        shortName: c.partyShortName || "UNK",
        logoUrl: c.partyLogoUrl,
        colorBg: c.partyColorBg || null,
        colorText: c.partyColorText || null,
        colorBorder: c.partyColorBorder || null,
        candidatesAnnounced: 0,
        incumbentsRetained: 0,
        newcomersFielded: 0,
        averageAssets: 0,
        totalCriminalCases: 0,
        criminalCandidatePercentage: 0,
        womenCandidatePercentage: 0,
        ownConstituencyPercent: 0,
        crossConstituencyPercent: 0
      });
    }

    const stats = partyStatsMap.get(c.partyId)!;
    stats.candidatesAnnounced++;
    if (c.isIncumbent) stats.incumbentsRetained++;
    if (c.isNewcomer) stats.newcomersFielded++;
    if (c.totalAssets) stats.averageAssets = (stats.averageAssets || 0) + c.totalAssets;
    if (c.criminalCases) {
      stats.totalCriminalCases = (stats.totalCriminalCases || 0) + c.criminalCases;
      stats.criminalCandidatePercentage = (stats.criminalCandidatePercentage || 0) + 1;
    }
    
    if (c.constituencyContestType === 'own_constituency') {
      stats.ownConstituencyPercent = (stats.ownConstituencyPercent || 0) + 1;
    } else if (c.constituencyContestType === 'cross_constituency') {
      stats.crossConstituencyPercent = (stats.crossConstituencyPercent || 0) + 1;
    }

    const gender = c.gender?.toLowerCase();
    if (gender === 'f' || gender === 'female') {
      stats.womenCandidatePercentage = (stats.womenCandidatePercentage || 0) + 1;
    }
  });

  return Array.from(partyStatsMap.values())
    .map(p => {
      const knownCount = (p.ownConstituencyPercent || 0) + (p.crossConstituencyPercent || 0);
      return {
        ...p,
        averageAssets: p.candidatesAnnounced > 0 ? Math.floor(p.averageAssets! / p.candidatesAnnounced) : null,
        criminalCandidatePercentage: p.candidatesAnnounced > 0 ? Math.floor((p.criminalCandidatePercentage! / p.candidatesAnnounced) * 100) : null,
        womenCandidatePercentage: p.candidatesAnnounced > 0 ? Math.floor((p.womenCandidatePercentage! / p.candidatesAnnounced) * 100) : null,
        ownConstituencyPercent: knownCount > 0 ? Math.floor((p.ownConstituencyPercent! / knownCount) * 100) : null,
        crossConstituencyPercent: knownCount > 0 ? Math.floor((p.crossConstituencyPercent! / knownCount) * 100) : null,
      };
    })
    .filter(p => {
      const name = (p.partyName || "").toLowerCase();
      const shortName = (p.shortName || "").toLowerCase();
      return name !== "independent" && shortName !== "ind";
    })
    .sort((a, b) => b.candidatesAnnounced - a.candidatesAnnounced);
}

/**
 * Builds top-level snapshot statistics for hero stats.
 */
export function buildDashboardSnapshotStats(
  candidates: DashboardCandidate[],
  contests: ContestCard[],
  partyCount: number,
  constituencies: any[]
): PreElectionSnapshotStats {
  const totalConstituencies = constituencies.length;
  const seatsWithCands = contests.filter(c => c.candidateCount > 0).length;
  const incumbentCount = contests.filter(c => c.isIncumbentRecontest).length;
  const openSeatCount = contests.filter(c => c.isOpenSeat).length;
  
  const validAges = candidates.filter(c => c.age && c.age > 0).map(c => c.age!);
  const avgAge = validAges.length > 0 ? Math.floor(validAges.reduce((a, b) => a + b, 0) / validAges.length) : null;
  
  const validAssets = candidates.filter(c => c.totalAssets && c.totalAssets > 0).map(c => c.totalAssets!);
  const avgAsset = validAssets.length > 0 ? Math.floor(validAssets.reduce((a, b) => a + b, 0) / validAssets.length) : null;
  
  const womenCount = candidates.filter(c => c.gender?.toLowerCase() === 'f' || c.gender?.toLowerCase() === 'female').length;

  const ownCount = candidates.filter(c => c.constituencyContestType === 'own_constituency').length;
  const crossCount = candidates.filter(c => c.constituencyContestType === 'cross_constituency').length;
  const knownCount = ownCount + crossCount;

  let totalVoters = 0;
  let maleVoters = 0;
  let femaleVoters = 0;
  let thirdGenderVoters = 0;

  constituencies.forEach(c => {
    const stats = c.statistics?.[VOTER_STATS_KEY];
    if (stats) {
      totalVoters += stats.total_electors || 0;
      maleVoters += stats.male || 0;
      femaleVoters += stats.female || 0;
      thirdGenderVoters += stats.third_gender || 0;
    }
  });

  return {
    totalConstituencies,
    totalCandidatesAnnounced: candidates.length,
    partiesWithCandidates: partyCount,
    seatsWithAnnouncedCandidates: seatsWithCands,
    incumbentsRecontestingPercent: seatsWithCands > 0 ? Math.floor((incumbentCount / seatsWithCands) * 100) : null,
    openSeatsPercent: seatsWithCands > 0 ? Math.floor((openSeatCount / seatsWithCands) * 100) : null,
    womenCandidatesPercent: candidates.length > 0 ? Math.floor((womenCount / candidates.length) * 100) : null,
    averageCandidateAge: avgAge,
    averageAssets: avgAsset,
    ownConstituencyPercent: knownCount > 0 ? Math.floor((ownCount / knownCount) * 100) : null,
    crossConstituencyPercent: knownCount > 0 ? Math.floor((crossCount / knownCount) * 100) : null,
    totalVoters: totalVoters > 0 ? totalVoters : null,
    maleVoters: maleVoters > 0 ? maleVoters : null,
    femaleVoters: femaleVoters > 0 ? femaleVoters : null,
    thirdGenderVoters: thirdGenderVoters > 0 ? thirdGenderVoters : null
  };
}

/**
 * Identifies candidates contesting from more than one constituency.
 */
export function getMultiConstituencyCandidates(candidates: DashboardCandidate[]): MultiConstituencyCandidate[] {
  const groups = new Map<string, DashboardCandidate[]>();
  
  candidates.forEach(c => {
    if (!c.personId) return;
    if (!groups.has(c.personId)) groups.set(c.personId, []);
    groups.get(c.personId)!.push(c);
  });

  const multiResult: MultiConstituencyCandidate[] = [];

  groups.forEach((cands, personId) => {
    const uniqueConstituencies = Array.from(new Set(cands.map(c => c.constituencyId)));
    if (uniqueConstituencies.length > 1) {
      const first = cands[0];
      multiResult.push({
        personId,
        name: first.name,
        partyName: first.partyName,
        partyLogoUrl: first.partyLogoUrl,
        count: uniqueConstituencies.length,
        constituencies: uniqueConstituencies.map(id => {
          const cand = cands.find(c => c.constituencyId === id);
          return cand?.constituencyName || "Unknown";
        })
      });
    }
  });

  return multiResult.sort((a, b) => b.count - a.count);
}

/**
 * Builds pre-election insights layer.
 */
export function buildPreElectionInsights(
  candidates: DashboardCandidate[],
  contests: ContestCard[]
): DashboardInsights {
  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    return val.toLocaleString();
  };

  const mapToInsight = (c: DashboardCandidate): ElectionInsightCandidate => ({
    name: c.name,
    party: c.partyShortName || "IND",
    partyName: c.partyName,
    partyShortName: c.partyShortName,
    constituencyName: c.constituencyName,
    value: 0,
    formattedValue: "",
    partyLogoUrl: c.partyLogoUrl,
    profilePic: c.profilePic,
    personId: c.personId
  });

  const richest = [...candidates]
    .filter(c => c.totalAssets && c.totalAssets > 0)
    .sort((a, b) => (b.totalAssets || 0) - (a.totalAssets || 0))
    .slice(0, 10)
    .map(c => ({ ...mapToInsight(c), value: c.totalAssets!, formattedValue: formatCurrency(c.totalAssets!) }));

  const youngest = [...candidates]
    .filter(c => c.age && c.age > 0)
    .sort((a, b) => (a.age || 99) - (b.age || 99))
    .slice(0, 10)
    .map(c => ({ ...mapToInsight(c), value: c.age!, formattedValue: `${c.age} Yrs` }));

  const oldest = [...candidates]
    .filter(c => c.age && c.age > 0)
    .sort((a, b) => (b.age || 0) - (a.age || 0))
    .slice(0, 10)
    .map(c => ({ ...mapToInsight(c), value: c.age!, formattedValue: `${c.age} Yrs` }));

  const mostCriminal = [...candidates]
    .filter(c => c.criminalCases && c.criminalCases > 0)
    .sort((a, b) => (b.criminalCases || 0) - (a.criminalCases || 0))
    .slice(0, 10)
    .map(c => ({ ...mapToInsight(c), value: c.criminalCases!, formattedValue: `${c.criminalCases} Cases` }));

  const closestSeats = contests
    .filter(c => c.lastMargin != null && c.lastMargin > 0)
    .sort((a, b) => (a.lastMargin || 0) - (b.lastMargin || 0))
    .slice(0, 10);

  const multiCorner = contests
    .filter(c => c.candidateCount >= 3)
    .sort((a, b) => b.candidateCount - a.candidateCount)
    .slice(0, 10);

  const avgAge = candidates.filter(c => c.age).reduce((acc, c) => acc + (c.age || 0), 0) / (candidates.filter(c => c.age).length || 1);

  // Helper to deduplicate and join constituencies
  const groupFocusCandidates = (list: DashboardCandidate[]) => {
    const groups = new Map<string, { cand: DashboardCandidate, constituencies: Set<string> }>();
    
    list.forEach(c => {
      // Use normalized name as the key to ensure candidates with different/missing personIds 
      // but identical names are correctly grouped in special focus sections.
      const key = c.name.trim().toUpperCase();
      if (!groups.has(key)) {
        groups.set(key, { cand: c, constituencies: new Set() });
      }
      groups.get(key)!.constituencies.add(c.constituencyName);
    });

    return Array.from(groups.values()).map(({ cand, constituencies }) => {
      const insight = mapToInsight(cand);
      insight.constituencyName = Array.from(constituencies).join(', ');
      return insight;
    });
  };

  const starCandidates = groupFocusCandidates(candidates.filter(c => c.isStarCandidate));
  const authorFocusCandidates = groupFocusCandidates(candidates.filter(c => c.authorFocused));

  // Contest Type Patterns
  const ownCount = candidates.filter(c => c.constituencyContestType === 'own_constituency').length;
  const crossCount = candidates.filter(c => c.constituencyContestType === 'cross_constituency').length;
  const knownCountForType = ownCount + crossCount;

  const crossPartiesMap = new Map<string, { partyName: string, shortName: string, count: number, partyLogoUrl?: string }>();
  candidates.filter(c => c.constituencyContestType === 'cross_constituency').forEach(c => {
    if (!c.partyId) return;
    const existing = crossPartiesMap.get(c.partyId);
    crossPartiesMap.set(c.partyId, {
      partyName: c.partyName || "Unknown",
      shortName: c.partyShortName || "IND",
      count: (existing?.count || 0) + 1,
      partyLogoUrl: c.partyLogoUrl || undefined
    });
  });

  const topCrossParties = Array.from(crossPartiesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    youngestCandidates: youngest,
    oldestCandidates: oldest,
    richestCandidates: richest,
    mostCriminalCases: mostCriminal,
    closestLastElectionSeats: closestSeats,
    multiCornerContests: multiCorner,
    openSeatsCount: contests.filter(c => c.isOpenSeat).length,
    incumbentRecontestCount: contests.filter(c => c.isIncumbentRecontest).length,
    averageCandidateAge: Math.floor(avgAge),
    contestTypePatterns: {
      ownCount,
      crossCount,
      ownPercent: knownCountForType > 0 ? Math.floor((ownCount / knownCountForType) * 100) : 0,
      crossPercent: knownCountForType > 0 ? Math.floor((crossCount / knownCountForType) * 100) : 0,
      topCrossParties
    },
    multiConstituencyCandidates: getMultiConstituencyCandidates(candidates),
    starCandidates: candidates.filter(c => c.isStarCandidate).map(mapToInsight),
    authorFocusCandidates: candidates.filter(c => c.authorFocused).map(mapToInsight)
  };
}
