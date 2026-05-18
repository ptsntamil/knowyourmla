import { cache } from "react";
import { MLARepository } from "../../repositories/mla.repository";
import { PartyRepository } from "../../repositories/party.repository";
import { derivePartyShortName } from "@/lib/utils/party-utils";
import { ConstituencyRepository } from "../../repositories/constituency.repository";
import { DistrictRepository } from "../../repositories/district.repository";
import { PersonRepository } from "../../repositories/person.repository";
import {
  ELECTION_YEAR_CURRENT,
  ELECTION_YEAR_PRIOR
} from "./dashboard.constants";
import { mapCandidatesToDashboardCandidates } from "./dashboard.mappers";
import { ConstituencyPreElectionOverlayData } from "./dashboard.types";
import { sortByPartyOrder } from "./dashboard.utils";
import { PREVIOUS_ELECTION_YEAR } from "@/lib/constants/elections";

/**
 * Aggregates 2026 pre-election overlay data for a specific constituency.
 */
export const getConstituencyPreElectionOverlayData = cache(async (slug: string): Promise<ConstituencyPreElectionOverlayData | null> => {
  const mlaRepo = new MLARepository();
  const partyRepo = new PartyRepository();
  const constituencyRepo = new ConstituencyRepository();
  const districtRepo = new DistrictRepository();
  const personRepo = new PersonRepository();

  const constituencyId = slug.startsWith("CONSTITUENCY#") ? slug : `CONSTITUENCY#${slug.toLowerCase()}`;

  try {
    // 1. Fetch constituency context
    const [constituency, allParties, allDistricts] = await Promise.all([
      constituencyRepo.getConstituencyMetadata(constituencyId),
      partyRepo.getAllParties(),
      districtRepo.getAllDistricts()
    ]);

    if (!constituency) return null;

    // 2. Fetch candidates for 2026 and 2021
    const [candidates2026, candidates2021] = await Promise.all([
      mlaRepo.getCandidatesByConstituencyAndYear(constituencyId, ELECTION_YEAR_CURRENT),
      mlaRepo.getCandidatesByConstituencyAndYear(constituencyId, ELECTION_YEAR_PRIOR)
    ]);

    // 3. Prepare metadata maps
    const partyMap = new Map<string, any>(allParties.map((p: any) => [p.PK, p]));
    const districtMap = new Map<string, string>(allDistricts.map((d: any) => [d.PK, d.name]));
    const constituencyMap = new Map<string, any>([[constituency.PK, constituency]]);

    const constituencyPriorWinners = new Map<string, any>();
    const priorWinner = candidates2021.find((c: any) => c.is_winner) ||
      [...candidates2021].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))[0];

    if (priorWinner) {
      constituencyPriorWinners.set(constituencyId, priorWinner);
    }

    // 4. Fetch person enrichment for 2026 candidates
    const personIds = Array.from(new Set(candidates2026.filter((c: any) => c.person_id).map((c: any) => c.person_id)));
    const persons = personIds.length > 0 ? await personRepo.getPersonsByIds(personIds as string[]) : [];
    const personMap = new Map(persons.map((p: any) => [p.PK, p]));

    // 5. Map to dashboard candidate objects
    const dashboardCandidates = mapCandidatesToDashboardCandidates(candidates2026, {
      partyMap,
      constituencyMap,
      districtMap,
      personMap,
      constituencyPriorWinners
    });

    // 6. Derive Overlay Metrics
    const has2026Candidates = dashboardCandidates.length > 0;
    const overlayStatus = has2026Candidates ? 'live' : 'upcoming';

    const isIncumbentRecontest = dashboardCandidates.some(c => c.isIncumbent);
    const isOpenSeat = !!priorWinner && !isIncumbentRecontest && has2026Candidates;

    const tags: string[] = [];
    if (!has2026Candidates) {
      tags.push("Upcoming");
      tags.push("Awaiting Candidates");
    } else {
      if (isOpenSeat) tags.push("Open Seat");
      if (isIncumbentRecontest) tags.push("Incumbent Recontest");
      if (dashboardCandidates.length >= 3) tags.push("Multi-Corner Contest");
      if (priorWinner?.winning_margin < 5000) tags.push(`Close Margin '${PREVIOUS_ELECTION_YEAR.slice(-2)}`);
    }

    const getParty = (pid: string | undefined) => {
      if (!pid) return null;
      return partyMap.get(pid) || partyMap.get(`PARTY#${pid}`) || null;
    };

    const priorWinnerParty = priorWinner ? getParty(priorWinner.party_id) : null;

    const majorParties = Array.from(new Set(dashboardCandidates.map(c => c.partyShortName).filter(Boolean))) as string[];

    return {
      constituencyId: constituencyId.replace("CONSTITUENCY#", ""),
      constituencyName: constituency.name,
      districtName: districtMap.get(constituency.district_id) || "N/A",
      has2026Candidates,
      overlayStatus,
      candidateCount: dashboardCandidates.length,
      currentMLA: priorWinner ? {
        name: priorWinner.candidate_name,
        party: priorWinnerParty?.name,
        partyShort: priorWinnerParty?.short_name || priorWinner.party_id?.replace("PARTY#", ""),
        logoUrl: priorWinnerParty?.logo_url
      } : null,
      lastElection: priorWinner ? {
        year: ELECTION_YEAR_PRIOR,
        winner: priorWinner.candidate_name,
        party: priorWinnerParty?.name,
        partyShort: priorWinnerParty?.short_name || derivePartyShortName(priorWinnerParty?.name || priorWinner.party_id?.replace("PARTY#", "")),
        margin: priorWinner.winning_margin,
        totalVotes: priorWinner.total_votes
      } : null,
      contestSummary: {
        isOpenSeat,
        isIncumbentRecontest,
        candidateCount: dashboardCandidates.length,
        majorPartyCount: majorParties.length,
        tags
      },
      candidates: sortByPartyOrder(dashboardCandidates, c => c.partyShortName),
      insights: {
        ownCount: dashboardCandidates.filter(c => c.constituencyContestType === 'own_constituency').length,
        crossCount: dashboardCandidates.filter(c => c.constituencyContestType === 'cross_constituency').length,
        newcomerCount: dashboardCandidates.filter(c => c.isNewcomer).length,
        incumbentCount: dashboardCandidates.filter(c => c.isIncumbent).length,
        majorParties
      }
    };

  } catch (error) {
    console.error(`Error aggregating constituency overlay data for ${slug}:`, error);
    return null;
  }
});
