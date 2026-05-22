import { DashboardCandidate } from "./dashboard.types";
import { STATUS_MAP, ELECTION_YEAR_CURRENT, ELECTION_YEAR_PRIOR } from "./dashboard.constants";
import { getPartyLogo, derivePartyShortName } from "@/lib/utils/party-utils";
import { normalizeEducation, normalizeProfession, normalizeTotalAssets, normalizeCriminalCases } from "@/lib/utils/profile-normalizers";
import { normalizeCandidateProfilePic } from "@/lib/utils/profile-pic.utils";

/**
 * Maps raw candidate records and metadata into clean DashboardCandidate objects.
 */
export function mapCandidatesToDashboardCandidates(
  candidates: any[],
  metadata: {
    partyMap: Map<string, any>;
    constituencyMap: Map<string, any>;
    districtMap: Map<string, string>;
    personMap: Map<string, any>;
    constituencyPriorWinners: Map<string, any>;
  }
): DashboardCandidate[] {
  const {
    partyMap,
    constituencyMap,
    districtMap,
    personMap,
    constituencyPriorWinners
  } = metadata;

  return candidates.map((c: any) => {
    // Robust party lookup
    const party = partyMap.get(c.party_id) || partyMap.get(`PARTY#${c.party_id}`);
    const constituency = constituencyMap.get(c.constituency_id) || constituencyMap.get(`CONSTITUENCY#${c.constituency_id}`);
    const districtName = districtMap.get(c.district_id || constituency?.district_id || `DISTRICT#${c.district_id}`) || "N/A";
    const person = personMap.get(c.person_id) || personMap.get(`PERSON#${c.person_id}`);

    const birthYear = person?.birth_year || c.birth_year;
    let age = null;
    if (birthYear) {
      const calculatedAge = ELECTION_YEAR_CURRENT - parseInt(birthYear);
      if (calculatedAge > 0 && calculatedAge < 120) {
        age = calculatedAge;
      }
    } else if (c.age) {
      age = Number(c.age);
    }

    // Use DB-precomputed flags for performance and consistency
    const isIncumbent = !!c.is_incumbent;
    const isNewcomer = !!c.new_comer;

    return {
      id: c.PK,
      personId: c.person_id?.replace("PERSON#", ""),
      name: c.candidate_name || person?.name || "Unknown",
      constituencyId: c.constituency_id?.replace("CONSTITUENCY#", ""),
      constituencyName: constituency?.name || c.constituency_name || "Unknown",
      districtId: constituency?.district_id?.replace("DISTRICT#", "") || c.district_id?.replace("DISTRICT#", ""),
      districtName: districtName,
      partyId: c.party_id?.replace("PARTY#", ""),
      partyName: party?.name || c.party_name || "Independent",
      partyShortName: party?.short_name || derivePartyShortName(party?.name || c.party_name),
      partyLogoUrl: getPartyLogo(party?.short_name || derivePartyShortName(party?.name || c.party_name)) || party?.logo_url || null,
      partyColorBg: party?.color_bg || null,
      partyColorText: party?.color_text || null,
      partyColorBorder: party?.color_border || null,
      status: STATUS_MAP.ANNOUNCED, // Default for v1 as per instruction
      isIncumbent,
      isNewcomer,
      gender: person?.sex || c.sex || null,
      age,
      education: normalizeEducation(c.education || person?.education) || null,
      profession: normalizeProfession(c.profession || person?.profession) || null,
      totalAssets: normalizeTotalAssets(c.total_assets),
      totalLiabilities: normalizeTotalAssets(c.total_liabilities),
      criminalCases: normalizeCriminalCases(c.criminal_cases),
      profilePic: normalizeCandidateProfilePic(c.profile_pic || person?.profile_pic || null),
      priorOffice: c.prior_office || null,
      priorElection: (() => {
        const priorWinner = constituencyPriorWinners.get(c.constituency_id);
        if (isIncumbent && priorWinner) {
          const priorWinnerParty = partyMap.get(priorWinner.party_id);
          return {
            year: ELECTION_YEAR_PRIOR,
            won: true,
            totalVotes: priorWinner.total_votes,
            winningMargin: priorWinner.winning_margin,
            marginPercentage: priorWinner.margin_percentage,
            partyShort: priorWinnerParty?.short_name || derivePartyShortName(priorWinnerParty?.name || priorWinner.party_id?.replace("PARTY#", ""))
          };
        }
        return null;
      })(),
      ...deriveConstituencyContestType(c.constituency_id, person?.voter_constituency_id),
      isStarCandidate: !!(c.is_star_candidate || c.is_star_canidate),
      authorFocused: !!(c.author_focused || c.author_foused)
    };
  });
}

/**
 * Derives whether a candidate is contesting from their home constituency.
 */
function deriveConstituencyContestType(contestCid: string, voterCid: string | null): {
  isContestingOwnConstituency: boolean | null;
  constituencyContestType: 'own_constituency' | 'cross_constituency' | 'unknown';
} {
  if (!contestCid || !voterCid) {
    return {
      isContestingOwnConstituency: null,
      constituencyContestType: 'unknown'
    };
  }

  const normalizedContestCid = contestCid.replace("CONSTITUENCY#", "");
  const normalizedVoterCid = voterCid.replace("CONSTITUENCY#", "");

  const isOwn = normalizedContestCid === normalizedVoterCid;

  return {
    isContestingOwnConstituency: isOwn,
    constituencyContestType: isOwn ? 'own_constituency' : 'cross_constituency'
  };
}
