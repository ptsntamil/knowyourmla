import { MLARepository } from "../repositories/mla.repository";
import { PersonRepository } from "../repositories/person.repository";
import { CandidateRepository } from "../repositories/candidate.repository";
import { ConstituencyRepository } from "../repositories/constituency.repository";
import { PartyRepository } from "../repositories/party.repository";
import { DistrictRepository } from "../repositories/district.repository";
import { unstable_cache } from "next/cache";
import {
  MLAProfileResponse,
  MLAListResponse,
  MLAListItem,
  PersonDetail,
  ElectionHistoryRecord,
  MLAAnalytics,
  WinRate,
  AssetGrowthRecord,
  VoteTrendRecord,
  MarginTrendRecord,
  IncomeGrowthRecord,
  CriminalCaseRecord,
  ElectionExpenseRecord
} from "@/types/models";
import { LATEST_ELECTION_YEAR } from "../constants/elections";
import { getPartyLogo } from "../utils/party-utils";
import { normalizeEducation, normalizeProfession, normalizeTotalAssets, normalizeIncome, normalizeCriminalCases } from "../utils/profile-normalizers";
import { normalizeCandidateProfilePic } from "../utils/profile-pic.utils";
import { categorizeEducation } from "../utils/insights";
import { getSharedPartyInfo } from "./shared/party-cache";

export class MLAService {
  private mlaRepo: MLARepository;
  private personRepo: PersonRepository;
  private candidateRepo: CandidateRepository;
  private constituencyRepo: ConstituencyRepository;
  private partyRepo: PartyRepository;
  private districtRepo: DistrictRepository;

  constructor(
    mlaRepo?: MLARepository,
    personRepo?: PersonRepository,
    candidateRepo?: CandidateRepository,
    constituencyRepo?: ConstituencyRepository,
    partyRepo?: PartyRepository,
    districtRepo?: DistrictRepository
  ) {
    this.mlaRepo = mlaRepo || new MLARepository();
    this.personRepo = personRepo || new PersonRepository();
    this.candidateRepo = candidateRepo || new CandidateRepository();
    this.constituencyRepo = constituencyRepo || new ConstituencyRepository();
    this.partyRepo = partyRepo || new PartyRepository();
    this.districtRepo = districtRepo || new DistrictRepository();
  }


  private slugify(name: string): string {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  private processAssetGrowth(record: any, prevAssets: number | null): [AssetGrowthRecord, number] {
    const currentAssets = normalizeTotalAssets(record.total_assets || record.assets);
    let growthPercent = null;
    if (prevAssets !== null && prevAssets > 0) {
      growthPercent = parseFloat((((currentAssets - prevAssets) / prevAssets) * 100).toFixed(2));
    }
    return [{
      year: parseInt(record.year || "0"),
      assets: currentAssets,
      growth_percent: growthPercent,
    }, currentAssets];
  }

  private processIncomeGrowth(record: any, prevIncome: number | null): [IncomeGrowthRecord, number] {
    const currentIncome = normalizeIncome(record.income_itr);
    let growthPercent = null;
    if (prevIncome !== null && prevIncome > 0) {
      growthPercent = parseFloat((((currentIncome - prevIncome) / prevIncome) * 100).toFixed(2));
    }
    return [{
      year: parseInt(record.year || "0"),
      income: currentIncome,
      growth_percent: growthPercent,
    }, currentIncome];
  }

  private aggregateItrHistory(record: any, totalItrHistory: Record<string, Record<string, number>>) {
    const itrH = record.itr_history;
    if (itrH && typeof itrH === "object") {
      for (const [relation, years] of Object.entries(itrH)) {
        if (!relation || relation.toLowerCase() === "none") continue;
        if (!totalItrHistory[relation]) totalItrHistory[relation] = {};
        if (years && typeof years === "object") {
          for (const [yrRange, amt] of Object.entries(years as object)) {
            if (!yrRange || yrRange.toLowerCase() === "none") continue;
            totalItrHistory[relation][yrRange] = parseFloat(amt as string) || 0;
          }
        }
      }
    }
  }

  private processElectionExpenses(record: any, prevExpenses: number | null): [ElectionExpenseRecord, number] {
    const currentExpenses = parseFloat(record.election_expenses || "0");
    let growthPercent = null;
    if (prevExpenses !== null && prevExpenses > 0) {
      growthPercent = parseFloat((((currentExpenses - prevExpenses) / prevExpenses) * 100).toFixed(2));
    }
    return [{
      year: parseInt(record.year || "0"),
      amount: currentExpenses,
      growth_percent: growthPercent,
    }, currentExpenses];
  }

  private parseGoldAssets(goldAssets: any): any {
    if (!goldAssets || typeof goldAssets !== "object") return goldAssets;

    const parsed: any = {};
    for (const [key, item] of Object.entries(goldAssets)) {
      if (!item || typeof item !== "object") {
        parsed[key] = item;
        continue;
      }

      const valObj = { ...(item as any) };
      let rawText = valObj.raw_text || "";
      const originalRaw = rawText;

      // 0. Separate Silver if mixed in raw_text
      if (rawText.toLowerCase().includes("silver") || rawText.toLowerCase().includes("sliver") || rawText.match(/\d+\s*kg$/i)) {
        const parts = rawText.split(/(?=silver|sliver|(?<=\+)\d+\s*kg)/i);
        rawText = parts[0].trim();
        if (rawText.match(/\d+\s*kg$/i)) {
          const kgMatch = rawText.match(/(\d+\s*kg)$/i);
          if (kgMatch) rawText = rawText.substring(0, kgMatch.index).trim();
        }
      }

      // Force re-parsing if rawText was modified or if gold/value are suspect/missing
      // or if rawText contains clear numeric markers which are usually better than stored values
      const hasMarkers = /Lacs|Thou|Cr|Crore/i.test(rawText);
      // If item already has a weight in weight/weight_grms, move it to gold
      if (!valObj.gold && (valObj.weight || valObj.weight_grms)) {
        valObj.gold = (valObj.weight || valObj.weight_grms).toString();
      }

      const needsReparse = rawText !== originalRaw || valObj.gold === "0" || !valObj.gold || valObj.value === "0" || !valObj.value || hasMarkers;

      // Clean up duplicated values (e.g., "500,300,000")
      if (valObj.value && typeof valObj.value === "string" && valObj.value.includes(",") && valObj.value.split(",").length > 2) {
        valObj.value = "0"; // Force re-parsing
      }

      if (needsReparse && rawText && rawText.toLowerCase() !== "nil") {
        valObj.raw_text = rawText; // Update raw_text to the stripped version

        // 1. Extract weight
        const weightMatch = rawText.match(/(?:GOLD\s+)?([\d,.]+)\s*(G|Gram|Grams|g|gm|grm|grms|GRM|GRAM|S|Sovereign|Sovereigns|Savaran|Savarans|Pavan|Pavans|Pawn|Pawns)(?:\s*GOLD)?/i);
        if (weightMatch) {
          const amt = parseFloat(weightMatch[1].replace(/,/g, ""));
          const unit = weightMatch[2].toLowerCase();
          if (unit.startsWith("s") || unit.startsWith("p") || unit.startsWith("sav")) {
            valObj.gold = (amt * 8).toString();
          } else {
            valObj.gold = amt.toString();
          }
        }

        // 2. Extract value
        const unitValMatch = rawText.match(/(?:G|Gram|Grams|g|gm|grm|grms|GRM|GRAM|S|Sovereign|Sovereigns|Savaran|Pavan|Pawn)\s*(?:gold\s*)?([\d,]+)/i);
        const goldValMatch = rawText.match(/GOLD\s*([\d,]+)/i);
        const lacsMatch = rawText.match(/(\d{1,3})\s*Lacs/i);
        const thouMatch = rawText.match(/(\d{1,3})\s*Thou/i);
        const crMatch = rawText.match(/(\d+)\s*Cr/i);

        if (unitValMatch) {
          let rawVal = unitValMatch[1].replace(/,/g, "");
          if (rawVal.length > 5) {
            for (let i = 1; i <= 3; i++) {
              const prefix = rawVal.substring(0, i);
              if (rawVal.endsWith(prefix) && rawVal.length > i + 4) {
                rawVal = rawVal.substring(0, rawVal.length - i);
                break;
              }
            }
          }
          valObj.value = rawVal;
        } else if (goldValMatch) {
          valObj.value = goldValMatch[1].replace(/,/g, "");
        } else if (lacsMatch) {
          valObj.value = (parseFloat(lacsMatch[1].replace(/,/g, "")) * 100000).toString();
        } else if (thouMatch) {
          valObj.value = (parseFloat(thouMatch[1].replace(/,/g, "")) * 1000).toString();
        } else if (crMatch) {
          valObj.value = (parseFloat(crMatch[1].replace(/,/g, "")) * 10000000).toString();
        }
      }
      parsed[key] = valObj;
    }
    return parsed;
  }

  private parseSilverAssets(silverAssets: any, goldAssets: any): any {
    const parsed: any = {};
    const defaultOwnerKeys = ["self", "spouse", "dep1"];

    const allKeys = new Set([...Object.keys(silverAssets || {}), ...Object.keys(goldAssets || {}), ...defaultOwnerKeys]);

    for (const key of allKeys) {
      const item = silverAssets?.[key] || { silver: "0", value: "0", raw_text: "" };
      const goldItem = goldAssets?.[key];
      let rawText = item.raw_text || "";

      // Extraction from gold_assets if needed (includes trailing Kg like "5 Kg")
      if (goldItem && goldItem.raw_text) {
        const goldRaw = goldItem.raw_text;
        const parts = goldRaw.split(/(?=silver|sliver|(?<=\+)\d+\s*kg)/i);
        let extracted = "";
        if (parts.length > 1) {
          extracted = parts.slice(1).join("").trim();
        } else {
          // Check for Kg at the end if no Silver keyword found
          const kgMatch = goldRaw.match(/\d+\s*kg$/i);
          if (kgMatch) extracted = kgMatch[0];
        }

        if (extracted && !rawText.toLowerCase().includes(extracted.toLowerCase())) {
          rawText = (rawText + " " + extracted).trim();
        }
      }

      const valObj = { ...item, raw_text: rawText };
      // Clean up duplicated values (e.g., "250,000,200,000")
      if (typeof valObj.value === "string" && valObj.value && valObj.value.includes(",")) {
        const parts = valObj.value.split(",");
        if (parts.length > 1 && parts.every((p: string) => p.length > 0)) {
          valObj.value = "0"; // Force re-parsing below
        }
      }

      if ((valObj.silver === "0" || valObj.value === "0") && rawText && rawText.toLowerCase() !== "nil") {
        // 1. Extract weight
        const weightMatch = rawText.match(/([\d,.]+)?\s*(KG|Gram|gm|grm|g)/i);
        if (weightMatch) {
          valObj.silver = weightMatch[0].trim();
        }

        // 2. Extract value
        const lacsMatch = rawText.match(/([\d.]+)\s*Lacs/i);
        const thouMatch = rawText.match(/([\d.]+)\s*Thou/i);
        const unitValMatch = rawText.match(/(?:KG|Gram|gm|grm|g)\s*([\d,]+)/i);
        const rsValMatch = rawText.match(/Rs\s*([\d,]+)/i);

        const rawValMatch = lacsMatch || thouMatch || unitValMatch || rsValMatch;

        if (lacsMatch) {
          valObj.value = (parseFloat(lacsMatch[1].replace(/,/g, "")) * 100000).toString();
        } else if (thouMatch) {
          valObj.value = (parseFloat(thouMatch[1].replace(/,/g, "")) * 1000).toString();
        } else if (rawValMatch) {
          valObj.value = rawValMatch[1].replace(/,/g, "");
        }
      }
      parsed[key] = valObj;
    }
    return parsed;
  }

  async getMLAProfile(identifier: string): Promise<MLAProfileResponse> {
    return unstable_cache(
      async (idStr: string): Promise<MLAProfileResponse> => {
        const identifier = idStr;
        let personId = identifier;
        if (!personId.startsWith("PERSON#")) {
          personId = `PERSON#${personId}`;
        }

        let personData = await this.personRepo.getPersonById(personId);
        if (!personData) {
          const normalizedSlug = identifier.toLowerCase().replace(/[^a-z0-9]/g, "");
          personData = await this.personRepo.getPersonByNormalizedName(normalizedSlug);
        }

        if (!personData) {
          throw new Error("Person not found");
        }

        const actualPersonId = personData.PK;
        const candidatesData = await this.candidateRepo.getPersonHistory(actualPersonId);
        candidatesData.sort((a, b) => parseInt(a.year || "0") - parseInt(b.year || "0"));

        const history: ElectionHistoryRecord[] = [];
        const assetGrowth: AssetGrowthRecord[] = [];
        const voteTrend: VoteTrendRecord[] = [];
        const incomeGrowth: IncomeGrowthRecord[] = [];
        const criminalCaseTrend: CriminalCaseRecord[] = [];
        const marginTrend: MarginTrendRecord[] = [];
        const electionExpensesTrend: ElectionExpenseRecord[] = [];
        const totalItrHistory: Record<string, Record<string, number>> = {};
        let totalWins = 0;
        let totalValidContested = 0;
        let prevAssets: number | null = null;
        let prevIncome: number | null = null;
        let prevExpenses: number | null = null;

        const processedAnalyticsYears = new Set<number>();
        
        // Hoist DB and Cache queries outside the loop
        const uniquePartyIds = Array.from(new Set(candidatesData.map(c => c.party_id)));
        const partyInfoList = await Promise.all(uniquePartyIds.map(id => getSharedPartyInfo(id)));
        const partyMap = Object.fromEntries(uniquePartyIds.map((id, i) => [String(id), partyInfoList[i]]));
        
        const uniqueConstiIds = Array.from(new Set(candidatesData.map(c => c.constituency_id).filter(Boolean)));
        const constiMetaList = await Promise.all(uniqueConstiIds.map(id => this.constituencyRepo.getConstituencyMetadata(id)));
        const constituencyCache = Object.fromEntries(uniqueConstiIds.map((id, i) => [id, constiMetaList[i] || {}]));

        for (const record of candidatesData) {
          const year = parseInt(record.year || "0");
          const isWinner = Boolean(record.is_winner);
          const hasResults = Boolean(record.total_votes || record.winning_margin);

          const partyInfo = partyMap[String(record.party_id)];

          let districtName: string | undefined;
          const cid = record.constituency_id;
          if (cid) {
            const constiData = constituencyCache[cid];
            if (constiData && Object.keys(constiData).length > 0) {
              districtName = constiData.district_name || (constiData.district_id ? constiData.district_id.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase()) : undefined);
            }
          }

          // Income Tax Details should merge 2026 also (aggregated from all affidavits)
          this.aggregateItrHistory(record, totalItrHistory);
          const constituencyFromId = (record.constituency_id || "")
            .replace("CONSTITUENCY#", "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l: any) => l.toUpperCase());
          const constituencyName = (record.constituency_name || constituencyFromId || "").toString().trim();
          const partyName = record.party_id
            ? (partyInfo.short_name || record.party_id.replace("PARTY#", "")).toUpperCase()
            : ((record.party_name || record.party || "") as string).toUpperCase();

          // Keep history complete even for pending elections so profile header/details can show latest party and constituency.
          // History should ALWAYS show all records, even duplicates in same year (2 seats).
          history.push({
            year,
            constituency: constituencyName,
            party: partyName,
            party_logo_url: partyInfo.logo,
            party_color_bg: partyInfo.color_bg,
            party_color_text: partyInfo.color_text,
            party_color_border: partyInfo.color_border,
            winner: isWinner,
            results_declared: hasResults,
            district_name: districtName || record.district_name || (record.district_id ? record.district_id.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase()) : undefined),
            margin: isWinner && hasResults ? parseInt(record.winning_margin || "0") : undefined,
            margin_percent: isWinner && hasResults ? parseFloat(record.margin_percentage || "0") : undefined,
            assets: normalizeTotalAssets(record.total_assets || record.assets || "0"),
            is_resigned: Boolean(record.is_resigned),
          });

          // For analytics trends (Assets, Income, Cases, etc.), we only need one data point per year.
          // If we've already processed this year for analytics, we skip pushing to the trend arrays.
          if (processedAnalyticsYears.has(year)) {
            continue;
          }
          processedAnalyticsYears.add(year);

          // Core outcome metrics should only be included if results are available (excludes pending results).
          if (hasResults) {
            totalValidContested++;
            if (isWinner) totalWins++;

            if (record.total_votes || record.vote_percent) {
              voteTrend.push({
                year,
                votes: parseInt(record.total_votes || "0"),
                vote_percent: record.vote_percent ? parseFloat(record.vote_percent.toString()) : null
              });
            }

            if (isWinner && (record.winning_margin || record.margin_percentage)) {
              marginTrend.push({
                year,
                margin: parseInt(record.winning_margin || "0"),
                margin_percent: parseFloat(record.margin_percentage || "0"),
              });
            }

            const [expenseRec, currentExpenses] = this.processElectionExpenses(record, prevExpenses);
            electionExpensesTrend.push(expenseRec);
            prevExpenses = currentExpenses;
          }

          // Asset and Income trends represent declarations, so they include 2026 data
          const [assetRec, currentAssets] = this.processAssetGrowth(record, prevAssets);
          assetGrowth.push(assetRec);
          prevAssets = currentAssets;

          const [incomeRec, currentIncome] = this.processIncomeGrowth(record, prevIncome);
          incomeGrowth.push(incomeRec);
          prevIncome = currentIncome;

          criminalCaseTrend.push({ year, cases: normalizeCriminalCases(record.criminal_cases) });
        }

        const winRateVal = totalValidContested > 0 ? (totalWins / totalValidContested) * 100 : 0;

        const latestRecord = candidatesData.length > 0 ? candidatesData[candidatesData.length - 1] : {} as any;

        const allDistricts = await this.districtRepo.getAllDistricts();
        const representedDistricts = allDistricts
          .filter((d: any) => 
            d.representatives?.some((r: any) => r.person_id === actualPersonId)
          )
          .map((d: any) => ({
            id: d.PK.replace("DISTRICT#", ""),
            name: d.name || d.PK.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase())
          }));

        const personDetail: PersonDetail = {
          person_id: actualPersonId,
          name: personData.name || "Unknown",
          image_url: normalizeCandidateProfilePic(latestRecord.profile_pic || personData.image_url) || null,
          education: normalizeEducation(latestRecord.education) || normalizeEducation(personData.education) || undefined,
          profession: normalizeProfession(latestRecord.profession) || normalizeProfession(personData.profession) || undefined,
          age: (personData.birth_year || personData.birthyear) ? new Date().getFullYear() - parseInt(personData.birth_year || personData.birthyear) : (personData.age ? parseInt(personData.age) : undefined),
          gender: personData.sex || undefined,
          social_profiles: personData.social_profiles || undefined,
          district_representatives: representedDistricts.length > 0 ? representedDistricts : undefined,
        };

        const analytics: MLAAnalytics = {
          win_rate: {
            total_contested: totalValidContested,
            total_wins: totalWins,
            win_rate: parseFloat(winRateVal.toFixed(2)),
          },
          asset_growth: assetGrowth,
          vote_trend: voteTrend,
          margin_trend: marginTrend,
          income_growth: incomeGrowth,
          criminal_case_trend: criminalCaseTrend,
          election_expenses_trend: electionExpensesTrend,
          itr_history: Object.keys(totalItrHistory).length > 0 ? totalItrHistory : undefined,
          gold_assets: this.parseGoldAssets(latestRecord.gold_assets) || null,
          silver_assets: this.parseSilverAssets(latestRecord.silver_assets, latestRecord.gold_assets) || null,
          vehicle_assets: latestRecord.vehicle_assets || null,
          land_assets: latestRecord.land_assets || null,
        };

        history.sort((a, b) => b.year - a.year);

        return { person: personDetail, history, analytics };
      },
      ["mla-profile", identifier],
      { revalidate: 86400, tags: [`mla-profile-${identifier}`] }
    )(identifier);
  }

  async getCurrentMLAs(year: number = parseInt(LATEST_ELECTION_YEAR)): Promise<MLAListResponse> {
    return unstable_cache(
      async (yr: number): Promise<MLAListResponse> => {
        const year = yr;
        const constituencies = await this.constituencyRepo.getAllConstituencies();

        let winners;
        if (year === 2021) {
          winners = await this.mlaRepo.getWinnersByYearRange(2021, 2026);
        } else if (year === 2026) {
          winners = await this.mlaRepo.getWinnersByYear(2026);
        } else {
          winners = await this.mlaRepo.getWinnersByYear(year);
        }

        winners.sort((a: any, b: any) => parseInt(a.year || "0") - parseInt(b.year || "0"));

        const personIds = Array.from(new Set(winners.map((w: any) => w.person_id).filter((id: string) => id)));
        const persons = await this.personRepo.getPersonsByIds(personIds as string[]);
        const personMap = persons.reduce((acc: any, p: any) => {
          acc[p.PK] = p;
          return acc;
        }, {});

        const winnerMap = winners.reduce((acc: any, w: any) => {
          acc[w.constituency_id] = w;
          return acc;
        }, {});

        // Hoist party DB/Cache lookup outside the 234 constituency loop
        const uniquePartyIds = Array.from(new Set(winners.map((w: any) => w.party_id)));
        const partyInfoList = await Promise.all(uniquePartyIds.map(id => getSharedPartyInfo(id)));
        const partyMap = Object.fromEntries(uniquePartyIds.map((id, i) => [String(id), partyInfoList[i]]));

        const mlaList: MLAListItem[] = [];
        for (const consti of constituencies) {
          const constId = consti.PK;
          const winner = winnerMap[constId];

          if (!winner) {
            mlaList.push({
              person_id: "",
              slug: "",
              name: "",
              constituency: consti.name || constId.replace("CONSTITUENCY#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase()),
              constituency_id: constId,
              party: "",
              period: `${year}-${year + 5}`,
              education: "Unknown",
            });
            continue;
          }

          const pId = winner.person_id;
          const personMeta = personMap[pId] || {};
          const displayName = personMeta.name || winner.candidate_name || "Unknown";
          const partyInfo = partyMap[String(winner.party_id)];

          mlaList.push({
            person_id: pId,
            slug: this.slugify(displayName),
            name: displayName,
            constituency: consti.name || constId.replace("CONSTITUENCY#", "").replace(/-/g, " ").replace(/\b\w/g, (l: any) => l.toUpperCase()),
            constituency_id: constId,
            party: winner.party_id ? (partyInfo.short_name || winner.party_id.replace("PARTY#", "")).toUpperCase() : "",
            party_logo_url: partyInfo.logo,
            party_color_bg: partyInfo.color_bg,
            party_color_text: partyInfo.color_text,
            party_color_border: partyInfo.color_border,
            period: `${year}-${year + 5}`,
            education: categorizeEducation(personMeta.education || winner.education),
            is_resigned: Boolean(winner.is_resigned),
          });
        }

        mlaList.sort((a, b) => a.constituency.localeCompare(b.constituency));

        return { mlas: mlaList, total: mlaList.length };
      },
      ["current-mlas", year.toString()],
      { revalidate: 86400, tags: [`mlas-list-${year}`] }
    )(year);
  }
}
