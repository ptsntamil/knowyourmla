import { DistrictInsights, DistrictMLA } from "@/types/models";
import { normalizeProfileEducation } from "./profile-normalizers";

/**
 * Formats a numeric asset value into a human-readable string (Cr, L).
 */
export function formatAssets(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)} L`;
  }
  return `₹${value.toLocaleString()}`;
}

/**
 * Normalizes education strings into standard categories.
 */
export function normalizeEducation(edu: any): string {
  if (!edu) return "Unknown";
  
  // Extract string if it's a dict or array
  const eduStr = typeof edu === "string" ? edu : normalizeProfileEducation(edu) || "";
  if (!eduStr) return "Unknown";

  const e = eduStr.toLowerCase();
  const eClean = e.replace(/\./g, "");

  // Doctorate
  if (e.includes("doctorate") || eClean.match(/\b(phd)\b/)) return "Doctorate";
  
  // Professional
  if (eClean.match(/\b(mbbs|bds|md|ms|dm|mch)\b/) || e.includes("advocate") || eClean.match(/\b(ca)\b/) || e.includes("engineer") || e.match(/\bdoctor\b/)) return "Professional";
  
  // Postgraduate
  if (e.includes("post graduate") || e.includes("master") || eClean.match(/\b(ma|msc|mcom|mtech|me|mba|mca)\b/) || e.includes("முதுகலை")) return "Postgraduate";
  
  // Graduate
  if (e.includes("graduate") || e.includes("bachelor") || eClean.match(/\b(ba|bsc|bcom|be|btech|llb|bl|bba|bca|babl|bbm|bms|bfa|lit)\b/) || e.includes("பட்டதாரி") || e.includes("பட்டப் படிப்பு")) return "Graduate";
  
  // Diploma
  if (e.includes("diploma") || eClean.match(/\b(dted|iti|dme|dce|dee|dece|adca|dca)\b/) || e.includes("பட்டயப் படிப்பு") || e.includes("computer education") || e.includes("computer application") || e.includes("vocational") || e.includes("training") || e.includes("certificate")) return "Diploma";
  
  // Higher Secondary
  if (e.includes("12th") || e.includes("12 th") || e.includes("twelfth") || eClean.includes("hsc") || e.includes("higher secondary") || e.includes("+2") || e.includes("plus two") || e.includes("pre university") || eClean.match(/\b(puc|intermediary|intermediate|11th|11 th|eleventh)\b/) || e.includes("புகுமுக வகுப்பு")) return "Higher Secondary";
  
  // School (10th and below)
  if (e.includes("10th") || e.includes("10 th") || e.includes("tenth") || eClean.includes("sslc") || eClean.includes("matric") || eClean.includes("aislc") || e.includes("school") || e.includes("class") || e.includes("standard") || e.match(/\b\d+\s*th\b/) || e.includes("pass") || e.includes("discontinued") || e.includes("interrupted") || e.includes("fail") || e.match(/\b\d+\s*(class|standard|pass)\b/)) return "School";
  
  return "Unknown";
}

/**
 * Calculates age from birth year.
 */
export function calculateAge(birthYear: string | number | null): number | null {
  if (!birthYear) return null;
  const year = typeof birthYear === "string" ? parseInt(birthYear) : birthYear;
  if (isNaN(year)) return null;
  return new Date().getFullYear() - year;
}

/**
 * Builds aggregate insights from a list of MLA objects.
 */
export function buildInsights(mlas: (DistrictMLA & { gender?: string; education?: string; isFresher?: boolean })[]): DistrictInsights {
  const ages = mlas.map(m => m.age).filter((a): a is number => a !== null);
  const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length) : null;

  const youngestMla = [...mlas]
    .filter(m => m.age !== null)
    .sort((a, b) => (a.age || 0) - (b.age || 0))[0] || null;

  const oldestMla = [...mlas]
    .filter(m => m.age !== null)
    .sort((a, b) => (b.age || 0) - (a.age || 0))[0] || null;

  const richestMla = [...mlas]
    .filter(m => m.assets !== null)
    .sort((a, b) => (b.assets || 0) - (a.assets || 0))[0] || null;

  const partyCounts: Record<string, number> = {};
  mlas.forEach(m => {
    const p = (m.party || "").toUpperCase();
    if (p !== "IND" && p !== "INDEPENDENT") {
      partyCounts[m.party] = (partyCounts[m.party] || 0) + 1;
    }
  });
  const sortedParties = Object.entries(partyCounts).sort((a, b) => b[1] - a[1]);
  const dominantParty = sortedParties.length > 0 ? {
    party: sortedParties[0][0],
    seats: sortedParties[0][1],
    totalSeats: mlas.length,
    tied: sortedParties.length > 1 && sortedParties[0][1] === sortedParties[1][1]
  } : null;

  const genderSplit = { male: 0, female: 0, other: 0, unknown: 0 };
  mlas.forEach((m) => {
    const gender = (m.gender || "").toLowerCase();
    if (gender.startsWith("m")) genderSplit.male++;
    else if (gender.startsWith("f")) genderSplit.female++;
    else if (gender.includes("other") || gender.includes("third")) genderSplit.other++;
    else genderSplit.unknown++;
  });

  const eduCounts: Record<string, number> = {};
  mlas.forEach((m) => {
    const edu = normalizeEducation(m.education || null);
    eduCounts[edu] = (eduCounts[edu] || 0) + 1;
  });
  const sortedEdu = Object.entries(eduCounts).sort((a, b) => b[1] - a[1]);
  const educationSummary = sortedEdu.length > 0 ? {
    topCategory: sortedEdu[0][0],
    count: sortedEdu[0][1],
    breakdown: sortedEdu.map(([label, count]) => ({ label, count }))
  } : null;

  const fresherVsRepeat = { fresher: 0, repeat: 0, unknown: 0 };
  mlas.forEach((m) => {
    if (m.isFresher === true) fresherVsRepeat.fresher++;
    else if (m.isFresher === false) fresherVsRepeat.repeat++;
    else fresherVsRepeat.unknown++;
  });

  const highestMarginMla = [...mlas]
    .filter(m => m.margin !== null && m.margin !== undefined)
    .sort((a, b) => (b.margin || 0) - (a.margin || 0))[0] || null;

  const highestVotesMla = [...mlas]
    .filter(m => m.votes !== null && m.votes !== undefined)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))[0] || null;

  return {
    averageAge,
    youngestMla,
    oldestMla,
    richestMla,
    highestMarginMla,
    highestVotesMla,
    dominantParty,
    genderSplit,
    educationSummary,
    fresherVsRepeat
  };
}


/**
 * Gets distribution data for charts.
 */
export function getDistributionData(mlas: any[], field: 'party' | 'gender' | 'education' | 'age'): { label: string, value: number, fill?: string }[] {
  if (field === 'age') {
    const groups = {
      '25-40': 0,
      '41-55': 0,
      '56-70': 0,
      '71+': 0,
      'Unknown': 0
    };
    mlas.forEach(m => {
      const a = m.age;
      if (!a) groups.Unknown++;
      else if (a <= 40) groups['25-40']++;
      else if (a <= 55) groups['41-55']++;
      else if (a <= 70) groups['56-70']++;
      else groups['71+']++;
    });
    return Object.entries(groups).map(([label, value]) => ({ label, value }));
  }

  const counts: Record<string, { value: number, fill?: string }> = {};
  mlas.forEach(m => {
    let val = m[field === 'party' ? 'partyShort' : field] || m[field] || 'Unknown';
    if (field === 'education') val = normalizeEducation(val);
    if (field === 'gender') {
      val = val.toLowerCase();
      if (val.startsWith('m')) val = 'Male';
      else if (val.startsWith('f')) val = 'Female';
      else val = 'Other/Unknown';
    }

    if (!counts[val]) {
      counts[val] = { value: 0 };
      if (field === 'party') {
        counts[val].fill = m.partyColorBorder || m.partyColor;
      }

    }
    counts[val].value++;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1].value - a[1].value)
    .map(([label, data]) => ({ label, value: data.value, fill: data.fill }));
}

