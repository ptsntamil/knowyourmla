import { MLARepository } from "../../repositories/mla.repository";
import { PartyRepository } from "../../repositories/party.repository";
import { ConstituencyRepository } from "../../repositories/constituency.repository";
import { DistrictRepository } from "../../repositories/district.repository";
import { PersonRepository } from "../../repositories/person.repository";
import {
  ELECTION_YEAR_CURRENT,
  ELECTION_YEAR_PRIOR,
  ELECTION_STATE
} from "./dashboard.constants";
import { mapCandidatesToDashboardCandidates } from "./dashboard.mappers";
import {
  buildContestCards,
  buildPartyRolloutSummary,
  buildDashboardSnapshotStats,
  buildPreElectionInsights
} from "./dashboard.derived";
import { buildDashboardFilterOptions } from "./dashboard.filters";
import { PreElectionDashboardPayload } from "./dashboard.types";
import { sortByPartyOrder } from "./dashboard.utils";
import { cache } from "react";

/**
 * Single source of truth for the Tamil Nadu Pre-Election Dashboard 2026.
 * Aggregates data from DynamoDB, normalizes it, and derives advanced metrics/insights.
 */
export const getTamilNaduPreElectionDashboardData = cache(async (): Promise<PreElectionDashboardPayload | null> => {
  const mlaRepo = new MLARepository();
  const partyRepo = new PartyRepository();
  const constituencyRepo = new ConstituencyRepository();
  const districtRepo = new DistrictRepository();
  const personRepo = new PersonRepository();

  try {
    // 1. Fetch all raw data in parallel
    const [
      candidates2026,
      candidates2021,
      parties,
      constituencies,
      districts
    ] = await Promise.all([
      mlaRepo.getAllCandidatesByYear(ELECTION_YEAR_CURRENT),
      mlaRepo.getWinnersByYear(ELECTION_YEAR_PRIOR),
      partyRepo.getAllParties(),
      constituencyRepo.getAllConstituencies(),
      districtRepo.getAllDistricts()
    ]);

    if (!candidates2026 || candidates2026.length === 0) {
      console.warn(`No candidate data found for ${ELECTION_YEAR_CURRENT} ${ELECTION_STATE} Assembly Election.`);
      // We still return early if we want, but usually better to return empty dashboard structure
    }

    // 2. Build metadata maps for efficient lookups
    const partyMap = new Map(parties.map((p: any) => [p.PK, p]));
    const constituencyMap = new Map(constituencies.map((c: any) => [c.PK, c]));
    const districtMap = new Map(districts.map((d: any) => [d.PK, d.name]));

    // Winners from prior election for context
    const constituencyPriorWinners = new Map<string, any>(
      candidates2021.map((c: any) => [c.constituency_id, c])
    );

    // // Fallback: If is_winner flag is missing, derive by highest vote getter
    // candidates2021ByConst.forEach((cands, cid) => {
    //   if (!constituencyWinners2021.has(cid) && cands.length > 0) {
    //     const winner = [...cands].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))[0];
    //     constituencyWinners2021.set(cid, winner);
    //   }
    // });

    // 3. Fetch Person-level enrichment only for 2026 candidates
    const personIds = Array.from(new Set(candidates2026.filter((c: any) => c.person_id).map((c: any) => c.person_id)));
    const persons = personIds.length > 0 ? await personRepo.getPersonsByIds(personIds as string[]) : [];
    const personMap = new Map(persons.map((p: any) => [p.PK, p]));

    // 4. Map and Aggregate
    const dashboardCandidates = mapCandidatesToDashboardCandidates(candidates2026, {
      partyMap,
      constituencyMap,
      districtMap,
      personMap,
      constituencyPriorWinners
    });

    const contests = buildContestCards(dashboardCandidates, constituencies, {
      districtMap,
      constituencyPriorWinners,
      partyMap
    });

    const partyRollout = buildPartyRolloutSummary(dashboardCandidates);

    const stats = buildDashboardSnapshotStats(
      dashboardCandidates,
      contests,
      partyRollout.length,
      constituencies
    );

    const insights = buildPreElectionInsights(dashboardCandidates, contests);
    const filters = buildDashboardFilterOptions(dashboardCandidates);

    return {
      stats,
      candidates: sortByPartyOrder(dashboardCandidates, c => c.partyShortName),
      contests,
      partyRollout,
      insights,
      filters
    };

  } catch (error) {
    console.error(`Error aggregating dashboard data for ${ELECTION_YEAR_CURRENT} ${ELECTION_STATE}:`, error);
    return null;
  }
});
