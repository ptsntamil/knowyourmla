import { DashboardCandidate, DashboardFilterOptions, FilterOption } from "./dashboard.types";
import { TN_PARTY_DISPLAY_ORDER, AGE_BANDS, ASSET_BANDS } from "./dashboard.constants";
import { getPartyRank } from "./dashboard.utils";

/**
 * Builds precomputed filter options based on available candidate data.
 */
export function buildDashboardFilterOptions(
  candidates: DashboardCandidate[]
): DashboardFilterOptions {
  const parties = new Map<string, { label: string, count: number }>();
  const districts = new Map<string, { label: string, count: number }>();
  const constituencies = new Map<string, { label: string, count: number }>();
  const education = new Map<string, number>();
  const gender = new Map<string, number>();
  const contestTypes = new Map<string, { label: string, count: number }>();
  
  // Pre-calculate constituency candidate density
  const constituencyCounts = new Map<string, number>();
  candidates.forEach(c => {
    if (c.constituencyId) {
      constituencyCounts.set(c.constituencyId, (constituencyCounts.get(c.constituencyId) || 0) + 1);
    }
  });

  // Pre-calculate multi-seat candidates
  const personSeatMap = new Map<string, Set<string>>();
  candidates.forEach(c => {
    if (c.personId && c.constituencyId) {
      if (!personSeatMap.has(c.personId)) personSeatMap.set(c.personId, new Set());
      personSeatMap.get(c.personId)!.add(c.constituencyId);
    }
  });
  let multiSeatCount = 0;
  personSeatMap.forEach(seats => {
    if (seats.size > 1) multiSeatCount += 1;
  });
  
  const ageStats = AGE_BANDS.map(band => ({ ...band, count: 0 }));
  const assetStats = ASSET_BANDS.map(band => ({ ...band, count: 0 }));
  let hasCriminal = 0;
  let noCriminal = 0;

  candidates.forEach(c => {
    // Parties - Consolidate Independents
    if (c.partyId) {
      const pName = (c.partyName || "").toLowerCase();
      const pShort = (c.partyShortName || "").toLowerCase();
      const isIndependent = pName === "independent" || pShort === "ind";
      
      const pid = isIndependent ? "independent" : c.partyId;
      const label = isIndependent ? "Independent" : (c.partyName || "Unknown");
      
      const existing = parties.get(pid);
      parties.set(pid, { 
        label, 
        count: (existing?.count || 0) + 1 
      });
    }

    // Districts
    if (c.districtId) {
      const existing = districts.get(c.districtId);
      districts.set(c.districtId, { 
        label: c.districtName || "Unknown", 
        count: (existing?.count || 0) + 1 
      });
    }

    // Constituencies
    if (c.constituencyId) {
      const existing = constituencies.get(c.constituencyId);
      constituencies.set(c.constituencyId, { 
        label: c.constituencyName, 
        count: (existing?.count || 0) + 1 
      });
    }

    // Education
    if (c.education) {
      education.set(c.education, (education.get(c.education) || 0) + 1);
    }

    // Gender
    if (c.gender) {
      const g = c.gender.toLowerCase();
      const label = g === 'm' || g === 'male' ? 'Male' : (g === 'f' || g === 'female' ? 'Female' : 'Others');
      gender.set(label, (gender.get(label) || 0) + 1);
    }

    // Age Bands
    if (c.age) {
      const band = ageStats.find(b => c.age! >= b.min && c.age! <= b.max);
      if (band) band.count++;
    }

    // Asset Bands
    if (c.totalAssets !== null) {
      const band = assetStats.find(b => c.totalAssets! >= b.min && c.totalAssets! <= b.max);
      if (band) band.count++;
    }

    // Criminal cases
    if (c.criminalCases && c.criminalCases > 0) hasCriminal++;
    else noCriminal++;
    
    // Contest Type
    if (c.constituencyContestType) {
      const existing = contestTypes.get(c.constituencyContestType);
      const label = c.constituencyContestType === 'own_constituency' ? 'Own Constituency' : (c.constituencyContestType === 'cross_constituency' ? 'Cross-Constituency' : 'Unknown');
      contestTypes.set(c.constituencyContestType, { 
        label, 
        count: (existing?.count || 0) + 1 
      });
    }

    // Identify if candidate is in a multi-corner contest (3+ candidates)
    const density = constituencyCounts.get(c.constituencyId || "") || 0;
    if (density >= 3) {
      const existing = contestTypes.get("multi_corner");
      contestTypes.set("multi_corner", {
        label: "Multi-Corner",
        count: (existing?.count || 0) + 1
      });
    }

    // Identify if candidate is multi-seat
    const seats = personSeatMap.get(c.personId || "");
    if (seats && seats.size > 1) {
      const existing = contestTypes.get("multi_seat");
      contestTypes.set("multi_seat", {
        label: "Multi-Seat",
        count: (existing?.count || 0) + 1
      });
    }
  });

  const mapToOptions = (map: Map<string, { label: string, count: number }>): FilterOption[] => 
    Array.from(map.entries())
      .map(([value, info]) => ({ value, label: info.label, count: info.count }))
      .sort((a, b) => a.label.localeCompare(b.label));

  return {
    parties: mapToOptions(parties).sort((a, b) => getPartyRank(a.value) - getPartyRank(b.value)),
    districts: mapToOptions(districts),
    constituencies: mapToOptions(constituencies),
    education: Array.from(education.entries()).map(([label, count]) => ({ label, value: label, count })),
    genders: Array.from(gender.entries()).map(([label, count]) => ({ label, value: label, count })),
    ageBands: ageStats.map(b => ({ label: b.label, value: b.label, count: b.count })),
    assetBands: assetStats.map(b => ({ label: b.label, value: b.label, count: b.count })),
    hasCriminalCases: [
      { label: 'Yes', value: 'yes', count: hasCriminal },
      { label: 'No', value: 'no', count: noCriminal }
    ].filter(o => o.count > 0),
    contestTypes: mapToOptions(contestTypes).filter(o => o.value !== 'unknown')
  };
}
