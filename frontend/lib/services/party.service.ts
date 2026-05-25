import { PartyRepository } from "../repositories/party.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { PersonRepository } from "../repositories/person.repository";
import { ElectionRepository } from "../repositories/election.repository";
import { normalizeTotalAssets } from "../utils/profile-normalizers";
import { categorizeEducation } from "../utils/insights";
import { unstable_cache } from "next/cache";

export class PartyService {
  private partyRepo: PartyRepository;
  private candidateRepo: CandidateRepository;
  private personRepo: PersonRepository;
  private electionRepo: ElectionRepository;

  constructor(
    partyRepo?: PartyRepository,
    candidateRepo?: CandidateRepository,
    personRepo?: PersonRepository,
    electionRepo?: ElectionRepository
  ) {
    this.partyRepo = partyRepo || new PartyRepository();
    this.candidateRepo = candidateRepo || new CandidateRepository();
    this.personRepo = personRepo || new PersonRepository();
    this.electionRepo = electionRepo || new ElectionRepository();
  }

  async getAllParties() {
    return unstable_cache(
      async () => {
        const parties = await this.partyRepo.getAllParties();
        return parties.filter((p: any) => {
          const name = (p.name || "").toLowerCase();
          const shortName = (p.short_name || "").toLowerCase();
          return name !== "independent" && shortName !== "ind";
        });
      },
      ["all-parties"],
      { revalidate: 86400, tags: ["parties"] }
    )();
  }

  async getPartyBySlug(slug: string) {
    return unstable_cache(
      async (s: string) => {
        // Try direct ID lookups first without a full table scan
        const direct = await this.partyRepo.getPartyBySlugDirect(s);
        if (direct) return direct;

        // Fallback: Use the fully cached all-parties array
        const all = await this.getAllParties();
        const normalizedSlug = s.toLowerCase().replace(/[^a-z0-9]/g, "");
        return all.find((p: any) => {
          const pNameNorm = (p.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const pShortNorm = (p.short_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const pSlugNorm = (p.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return pNameNorm === normalizedSlug || pShortNorm === normalizedSlug || pSlugNorm === normalizedSlug;
        }) || null;
      },
      ["party-by-slug", slug],
      { revalidate: 86400, tags: [`party-slug-${slug}`] }
    )(slug);
  }

  async getPartyElections(partyId: string) {
    return unstable_cache(
      async (pId: string) => {
        const allCandidates = await this.candidateRepo.getCandidatesByParty(pId);
        const years = Array.from(new Set(allCandidates.map((c: any) => c.year))).sort((a, b) => b - a);
        
        // Fetch election metadata for these years
        const electionMetadata = await this.electionRepo.getAllElections();
        
        return years.map(year => {
          const meta = electionMetadata.find(m => m.year === year && m.type === "Assembly");
          return {
            year,
            name: meta ? `Tamil Nadu ${meta.category} ${meta.type} Election ${year}` : `${year} Assembly Election`,
            id: year.toString()
          };
        });
      },
      ["party-elections", partyId],
      { revalidate: 86400, tags: [`party-elections-${partyId}`] }
    )(partyId);
  }

  async getPartyAnalytics(partyId: string, year?: number) {
    return unstable_cache(
      async (pId: string, yr?: number) => {
        const allCandidates = await this.candidateRepo.getCandidatesByParty(pId);
        
        if (!allCandidates || allCandidates.length === 0) {
          return null;
        }

        const educationLevels = [
          "Doctorate", "Post Graduate", "Graduate Professional", "Graduate", 
          "12th Pass", "10th Pass", "8th Pass", "5th Pass", "Literate", "Illiterate", "Others"
        ];


        const normalizeOccupation = (prof: any = "") => {
          const p = (prof || "").toString().toLowerCase();
          if (p.includes("politics") || p.includes("public service") || p.includes("mla") || p.includes("mp")) return "Politics";
          if (p.includes("business") || p.includes("trade") || p.includes("commerce") || p.includes("industry")) return "Business";
          if (p.includes("agri") || p.includes("farm") || p.includes("cultivator")) return "Agriculture";
          if (p.includes("social") || p.includes("service") || p.includes("activist")) return "Social Work";
          if (p.includes("advocate") || p.includes("lawyer") || p.includes("doctor") || p.includes("eng") || p.includes("teach")) return "Professional";
          if (p.includes("retir") || p.includes("pension")) return "Retired";
          if (p.includes("house") || p.includes("wife")) return "Homemaker";
          return "Others";
        };

        const getAssetBucket = (assets: number) => {
          if (assets < 1000000) return "< ₹10 Lakh";
          if (assets < 5000000) return "₹10 Lakh - ₹50 Lakh";
          if (assets < 10000000) return "₹50 Lakh - ₹1 Crore";
          if (assets < 50000000) return "₹1 Crore - ₹5 Crore";
          if (assets < 100000000) return "₹5 Crore - ₹10 Crore";
          return "> ₹10 Crore";
        };

        // Filter by year if provided
        const filteredCandidates = yr 
          ? allCandidates.filter((c: any) => c.year === yr)
          : allCandidates;

        if (filteredCandidates.length === 0) return null;

        // Fetch persons for the filtered set (to get gender/etc)
        const uniquePersonIds = Array.from(new Set(filteredCandidates.map((c: any) => c.person_id).filter(id => id)));
        const persons = await this.personRepo.getPersonsByIds(uniquePersonIds as string[]);
        const personMap = new Map(persons.map((p: any) => [p.PK, p]));

        // Basic Stats
        const totalContested = filteredCandidates.length;
        const totalWins = filteredCandidates.filter((c: any) => c.is_winner).length;
        const winRate = (totalWins / totalContested) * 100;

        // Age Analytics
        const getAge = (c: any) => {
            const person = personMap.get(c.person_id);
            const birthYear = person?.birth_year || person?.birthyear || c.birth_year || c.birthyear || (c.year - (parseInt(c.age) || 0));
            if (!birthYear || isNaN(birthYear)) return NaN;
            return c.year - birthYear;
        };

        const validCandidatesWithAge = filteredCandidates.filter((c: any) => {
            const age = getAge(c);
            return !isNaN(age) && age > 18 && age < 100;
        });

        const ages = validCandidatesWithAge.map(getAge);
        const youngestAge = ages.length > 0 ? Math.min(...ages) : null;
        const eldestAge = ages.length > 0 ? Math.max(...ages) : null;

        const youngestCandidate = youngestAge 
            ? validCandidatesWithAge.find(c => getAge(c) === youngestAge)
            : null;
        const eldestCandidate = eldestAge
            ? validCandidatesWithAge.find(c => getAge(c) === eldestAge)
            : null;

        // Education Analytics
        const eduCounts: Record<string, number> = {};
        educationLevels.forEach(l => eduCounts[l] = 0);
        filteredCandidates.forEach((c: any) => {
          const norm = categorizeEducation(c.education);
          eduCounts[norm] = (eduCounts[norm] || 0) + 1;
        });
        const graduateCount = (eduCounts["Graduate"] || 0) + (eduCounts["Graduate Professional"] || 0) + (eduCounts["Post Graduate"] || 0) + (eduCounts["Doctorate"] || 0);

        // Criminal Analytics
        const criminalCounts = filteredCandidates.map((c: any) => parseInt(c.criminal_cases) || 0);
        const withCriminalCases = criminalCounts.filter(n => n > 0).length;
        const maxCriminalCases = criminalCounts.length > 0 ? Math.max(...criminalCounts) : 0;
        const highestCriminalCandidate = maxCriminalCases > 0 
          ? filteredCandidates.find((c: any) => (parseInt(c.criminal_cases) || 0) === maxCriminalCases) 
          : null;

        // Asset Analytics
        const assetValues = filteredCandidates.map((c: any) => normalizeTotalAssets(c.total_assets)).sort((a, b) => a - b);
        const medianAssets = assetValues.length > 0 ? assetValues[Math.floor(assetValues.length / 2)] : 0;
        const totalAssets = assetValues.reduce((a, b) => a + b, 0);
        const crorepatiCount = assetValues.filter(v => v >= 10000000).length;
        const highestAssetCandidate = filteredCandidates.find((c: any) => normalizeTotalAssets(c.total_assets) === assetValues[assetValues.length - 1]);
        const lowestAssetCandidate = filteredCandidates.find((c: any) => normalizeTotalAssets(c.total_assets) === assetValues[0]);

        const assetBuckets: Record<string, number> = {
          "< ₹10 Lakh": 0, "₹10 Lakh - ₹50 Lakh": 0, "₹50 Lakh - ₹1 Crore": 0,
          "₹1 Crore - ₹5 Crore": 0, "₹5 Crore - ₹10 Crore": 0, "> ₹10 Crore": 0
        };
        assetValues.forEach(v => {
          const b = getAssetBucket(v);
          assetBuckets[b]++;
        });

        // Occupation Analytics
        const occCounts: Record<string, number> = {};
        filteredCandidates.forEach((c: any) => {
          const norm = normalizeOccupation(c.profession || c.occupation);
          occCounts[norm] = (occCounts[norm] || 0) + 1;
        });

        // Gender Analytics
        let maleCandidates = 0;
        let femaleCandidates = 0;
        filteredCandidates.forEach((c: any) => {
          const person = personMap.get(c.person_id);
          if (person) {
            const sex = (person.sex || person.gender || "").toLowerCase();
            if (["female", "f", "w"].includes(sex)) femaleCandidates++;
            else maleCandidates++;
          }
        });

        // New vs Repeat logic
        let newCandidatesCount = 0;
        let repeatCandidatesCount = 0;
        const allUniquePersonIds = new Set(allCandidates.map((c: any) => c.person_id));

        if (yr) {
          filteredCandidates.forEach((c: any) => {
            const hasPreviousContest = allCandidates.some((prev: any) => prev.person_id === c.person_id && prev.year < yr);
            hasPreviousContest ? repeatCandidatesCount++ : newCandidatesCount++;
          });
        } else {
          newCandidatesCount = allUniquePersonIds.size;
          repeatCandidatesCount = allCandidates.length - allUniquePersonIds.size;
        }

        // Deposit Lost Analytics (Only for specific year view)
        let depositLostStats = null;
        if (yr) {
          let depositLostCount = 0;
          let depositSavedCount = 0;
          filteredCandidates.forEach((c: any) => {
            if (c.deposit_lost === true || c.deposit_lost === "true" || c.deposit_lost === 1) {
              depositLostCount++;
            } else {
              depositSavedCount++;
            }
          });
          depositLostStats = {
            seatsContested: totalContested,
            depositLostCount,
            depositSavedCount,
            depositLossPercentage: totalContested > 0 ? (depositLostCount / totalContested) * 100 : 0
          };
        }

        const availableYears = Array.from(new Set(allCandidates.map((c: any) => c.year))).sort((a, b) => b - a);

        return {
          stats: {
            totalContested, totalWins, winRate: winRate.toFixed(1),
            newCandidates: newCandidatesCount, repeatCandidates: repeatCandidatesCount,
            firstYear: Math.min(...availableYears), latestYear: Math.max(...availableYears),
          },
          age: {
            youngest: youngestAge, youngestName: youngestCandidate?.candidate_name, youngestId: youngestCandidate?.person_id?.replace("PERSON#", ""), youngestPic: youngestCandidate?.profile_pic,
            eldest: eldestAge, eldestName: eldestCandidate?.candidate_name, eldestId: eldestCandidate?.person_id?.replace("PERSON#", ""), eldestPic: eldestCandidate?.profile_pic,
            ageBelow40: ages.filter(a => a < 40).length,
            age40to50: ages.filter(a => a >= 40 && a <= 50).length,
            ageAbove50: ages.filter(a => a > 50).length,
          },
          education: {
            distribution: Object.entries(eduCounts).map(([name, value]) => ({ name, value })),
            graduateCount,
            mostCommon: Object.entries(eduCounts).sort((a, b) => b[1] - a[1])[0][0],
            total: totalContested
          },
          criminal: {
            total: withCriminalCases,
            percentage: ((withCriminalCases / totalContested) * 100).toFixed(1),
            max: maxCriminalCases,
            highestCandidate: highestCriminalCandidate?.candidate_name,
            highestCandidateId: highestCriminalCandidate?.person_id?.replace("PERSON#", ""),
            highestCandidatePic: highestCriminalCandidate?.profile_pic
          },
          gender: {
            male: maleCandidates,
            female: femaleCandidates,
            femalePercentage: ((femaleCandidates / (maleCandidates + femaleCandidates || 1)) * 100).toFixed(1)
          },
          assets: {
            highest: assetValues[assetValues.length - 1],
            highestName: highestAssetCandidate?.candidate_name,
            highestId: highestAssetCandidate?.person_id?.replace("PERSON#", ""),
            highestPic: highestAssetCandidate?.profile_pic,
            lowest: assetValues[0],
            lowestName: lowestAssetCandidate?.candidate_name,
            lowestId: lowestAssetCandidate?.person_id?.replace("PERSON#", ""),
            lowestPic: lowestAssetCandidate?.profile_pic,
            average: totalAssets / totalContested,
            median: medianAssets,
            crorepatiCount,
            crorepatiPercentage: ((crorepatiCount / totalContested) * 100).toFixed(1),
            distribution: Object.entries(assetBuckets).map(([name, value]) => ({ name, value }))
          },
          occupation: {
            distribution: Object.entries(occCounts).map(([name, value]) => ({ name, value })),
            top: Object.entries(occCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }))
          },
          depositLost: depositLostStats,
          timeline: availableYears.map(y => {
            const yearCands = allCandidates.filter((c: any) => c.year === y);
            const yearAges = yearCands.map(getAge).filter(a => !isNaN(a) && a > 18);
            const yearFemales = yearCands.filter((c: any) => {
              const p = personMap.get(c.person_id);
              return p && ["female", "f", "w"].includes((p.sex || p.gender || "").toLowerCase());
            }).length;
            
            return {
              year: y,
              candidates: yearCands.length,
              wins: yearCands.filter((c: any) => c.is_winner).length,
              avgAssets: yearCands.reduce((a, b) => a + normalizeTotalAssets(b.total_assets), 0) / (yearCands.length || 1),
              avgAge: yearAges.length > 0 ? (yearAges.reduce((a, b) => a + b, 0) / yearAges.length) : 0,
              femalePercentage: (yearFemales / (yearCands.length || 1)) * 100,
              criminalPercentage: (yearCands.filter((c: any) => (parseInt(c.criminal_cases) || 0) > 0).length / (yearCands.length || 1)) * 100
            };
          })
        };
      },
      ["party-analytics", partyId, year?.toString() || "all"],
      { revalidate: 86400, tags: [`party-analytics-${partyId}-${year}`] }
    )(partyId, year);
  }

  async getPartyCandidatesForYear(partyId: string, year?: number) {
    return unstable_cache(
      async (pId: string, yr?: number) => {
        const candidates = await this.candidateRepo.getCandidatesByPartyAndYear(pId, yr);
        if (!candidates) return [];

        // Fetch history for 'is_new' badge
        const allHistory = await this.candidateRepo.getCandidatesByParty(pId);
        
        // Fetch persons for gender/age/profile_pic
        const uniquePersonIds = Array.from(new Set(candidates.map((c: any) => c.person_id).filter(id => id)));
        const persons = await this.personRepo.getPersonsByIds(uniquePersonIds as string[]);
        const personMap = new Map(persons.map((p: any) => [p.PK, p]));

        return candidates.map((c: any) => {
          const person = personMap.get(c.person_id);
          const assets = normalizeTotalAssets(c.total_assets);
          const criminal = parseInt(c.criminal_cases) || 0;
          const isWinner = c.is_winner === true || c.is_winner === "true" || c.is_winner === 1;
          
          const effectiveYear = yr || c.year;
          const hasPrevious = allHistory.some((prev: any) => prev.person_id === c.person_id && prev.year < effectiveYear);
          
          const sex = ((person?.sex || person?.gender || "").toLowerCase());
          const isWoman = ["female", "f", "w"].includes(sex);

          const birthYear = person?.birth_year || person?.birthyear || c.birth_year || c.birthyear || (c.year - (parseInt(c.age) || 45));
          const age = effectiveYear - birthYear;

          return {
            ...c,
            total_assets: assets,
            profile_pic: c.profile_pic || person?.profile_pic,
            badges: {
              winner: isWinner,
              crorepati: assets >= 10000000,
              criminal: criminal > 0,
              new: !hasPrevious,
              young: age < 40 && age > 18,
              graduate: ["Graduate", "Graduate Professional", "Post Graduate", "Doctorate"].includes(categorizeEducation(c.education)),
              woman: isWoman
            }
          };
        });
      },
      ["party-candidates-for-year", partyId, year?.toString() || "all"],
      { revalidate: 86400, tags: [`party-candidates-${partyId}-${year}`] }
    )(partyId, year);
  }


}
