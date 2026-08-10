import { ConstituencyRepository } from "../repositories/constituency.repository";
import { getConstituencyDemographics, DemographicCategory } from "../utils/demographics";
import { unstable_cache } from "next/cache";

export interface ConstituencyAnalysisResult {
  constituencyId: string;
  constituencyName: string;
  districtId: string;
  category: DemographicCategory;
  votes2021: number;
  votes2026: number;
  votesAdded: number;
  growthPercentage: number;
  turnout2021: number;
  turnout2026: number;
}

export interface AggregateAnalysis {
  totalConstituencies: number;
  totalVotes2021: number;
  totalVotes2026: number;
  totalVotesAdded: number;
  averageGrowthPercentage: number;
  averageTurnout2026: number;
  medianGrowthPercentage: number;
  highestConstituency: ConstituencyAnalysisResult | null;
  lowestConstituency: ConstituencyAnalysisResult | null;
  constituencies: ConstituencyAnalysisResult[];
}

export interface DistrictComparison {
  districtId: string;
  urbanGrowth: number;
  semiUrbanGrowth: number;
  ruralGrowth: number;
}

export interface UrbanRuralAnalysisData {
  urban: AggregateAnalysis;
  semiUrban: AggregateAnalysis;
  rural: AggregateAnalysis;
  allConstituencies: ConstituencyAnalysisResult[];
  districtComparisons: DistrictComparison[];
  insights: string[];
}

class AnalysisService {
  private constituencyRepo = new ConstituencyRepository();

  public async getUrbanRural2026Comparison(): Promise<UrbanRuralAnalysisData> {
    const rawConstituencies = await this.constituencyRepo.getAllConstituencies();
    const results: ConstituencyAnalysisResult[] = [];
    const districtGroups: Record<string, { urbanGrowth: number[], semiUrbanGrowth: number[], ruralGrowth: number[] }> = {};

    for (const item of rawConstituencies) {
      const stats2021 = item.statistics?.["2021"];
      const stats2026 = item.statistics?.["2026"];

      if (!stats2021 || !stats2026) continue;

      const votes2021 = Number(stats2021.total_votes_polled) || 0;
      const votes2026 = Number(stats2026.total_votes_polled) || 0;
      
      if (votes2021 === 0 || votes2026 === 0) continue;

      const votesAdded = votes2026 - votes2021;
      const growthPercentage = (votesAdded / votes2021) * 100;
      const turnout2021 = Number(stats2021.poll_percentage) || 0;
      const turnout2026 = Number(stats2026.poll_percentage) || 0;
      
      const category = getConstituencyDemographics(item.demographic);
      
      const result: ConstituencyAnalysisResult = {
        constituencyId: item.PK,
        constituencyName: item.name || "",
        districtId: item.district_id || "",
        category,
        votes2021,
        votes2026,
        votesAdded,
        growthPercentage,
        turnout2021,
        turnout2026
      };
      
      results.push(result);

      if (item.district_id) {
        if (!districtGroups[item.district_id]) {
          districtGroups[item.district_id] = { urbanGrowth: [], semiUrbanGrowth: [], ruralGrowth: [] };
        }
        if (category === "Urban") {
          districtGroups[item.district_id].urbanGrowth.push(growthPercentage);
        } else if (category === "Semi Urban") {
          districtGroups[item.district_id].semiUrbanGrowth.push(growthPercentage);
        } else {
          districtGroups[item.district_id].ruralGrowth.push(growthPercentage);
        }
      }
    }

    const urbanConstituencies = results.filter(c => c.category === "Urban");
    const semiUrbanConstituencies = results.filter(c => c.category === "Semi Urban");
    const ruralConstituencies = results.filter(c => c.category === "Rural");

    const urbanAgg = this.aggregate(urbanConstituencies);
    const semiUrbanAgg = this.aggregate(semiUrbanConstituencies);
    const ruralAgg = this.aggregate(ruralConstituencies);

    const districtComparisons: DistrictComparison[] = Object.keys(districtGroups).map(dId => {
      const uArr = districtGroups[dId].urbanGrowth;
      const sArr = districtGroups[dId].semiUrbanGrowth;
      const rArr = districtGroups[dId].ruralGrowth;
      return {
        districtId: dId,
        urbanGrowth: uArr.length > 0 ? uArr.reduce((a, b) => a + b, 0) / uArr.length : 0,
        semiUrbanGrowth: sArr.length > 0 ? sArr.reduce((a, b) => a + b, 0) / sArr.length : 0,
        ruralGrowth: rArr.length > 0 ? rArr.reduce((a, b) => a + b, 0) / rArr.length : 0,
      };
    }).filter(d => d.urbanGrowth > 0 || d.semiUrbanGrowth > 0 || d.ruralGrowth > 0);

    const insights = this.generateInsights(urbanAgg, ruralAgg, districtComparisons);

    return {
      urban: urbanAgg,
      semiUrban: semiUrbanAgg,
      rural: ruralAgg,
      allConstituencies: results,
      districtComparisons,
      insights
    };
  }

  private aggregate(data: ConstituencyAnalysisResult[]): AggregateAnalysis {
    if (data.length === 0) {
      return {
        totalConstituencies: 0,
        totalVotes2021: 0,
        totalVotes2026: 0,
        totalVotesAdded: 0,
        averageGrowthPercentage: 0,
        averageTurnout2026: 0,
        medianGrowthPercentage: 0,
        highestConstituency: null,
        lowestConstituency: null,
        constituencies: [],
      };
    }

    let totalVotes2021 = 0;
    let totalVotes2026 = 0;
    let totalTurnout = 0;

    data.forEach(c => {
      totalVotes2021 += c.votes2021;
      totalVotes2026 += c.votes2026;
      totalTurnout += c.turnout2026;
    });

    const totalVotesAdded = totalVotes2026 - totalVotes2021;
    const averageGrowthPercentage = totalVotes2021 > 0 ? (totalVotesAdded / totalVotes2021) * 100 : 0;
    const averageTurnout2026 = totalTurnout / data.length;

    const sortedByGrowth = [...data].sort((a, b) => a.growthPercentage - b.growthPercentage);
    const mid = Math.floor(sortedByGrowth.length / 2);
    const medianGrowthPercentage = sortedByGrowth.length % 2 !== 0 
      ? sortedByGrowth[mid].growthPercentage 
      : (sortedByGrowth[mid - 1].growthPercentage + sortedByGrowth[mid].growthPercentage) / 2;
    
    const sortedByVotesAdded = [...data].sort((a, b) => b.votesAdded - a.votesAdded);

    return {
      totalConstituencies: data.length,
      totalVotes2021,
      totalVotes2026,
      totalVotesAdded,
      averageGrowthPercentage,
      averageTurnout2026,
      medianGrowthPercentage,
      highestConstituency: sortedByVotesAdded[0] || null,
      lowestConstituency: sortedByVotesAdded[sortedByVotesAdded.length - 1] || null,
      constituencies: sortedByVotesAdded,
    };
  }

  private generateInsights(urbanAgg: AggregateAnalysis, ruralAgg: AggregateAnalysis, districts: DistrictComparison[]): string[] {
    const insights: string[] = [];
    
    if (urbanAgg.totalVotesAdded > 0) {
      insights.push(`Urban constituencies added ${(urbanAgg.totalVotesAdded / 100000).toFixed(2)} lakh votes.`);
    }
    if (ruralAgg.totalVotesAdded > 0) {
      insights.push(`Rural constituencies added ${(ruralAgg.totalVotesAdded / 100000).toFixed(2)} lakh votes.`);
    }

    insights.push(`Urban constituencies recorded an average vote growth of ${urbanAgg.averageGrowthPercentage.toFixed(2)}%.`);
    insights.push(`Rural constituencies recorded ${ruralAgg.averageGrowthPercentage.toFixed(2)}%.`);

    if (urbanAgg.highestConstituency) {
      insights.push(`Top urban constituency by votes added: ${urbanAgg.highestConstituency.constituencyName} (+${urbanAgg.highestConstituency.votesAdded.toLocaleString()}).`);
    }
    if (ruralAgg.highestConstituency) {
      insights.push(`Top rural constituency by votes added: ${ruralAgg.highestConstituency.constituencyName} (+${ruralAgg.highestConstituency.votesAdded.toLocaleString()}).`);
    }

    let uExceedsR = 0;
    let rExceedsU = 0;
    districts.forEach(d => {
      if (d.urbanGrowth > d.ruralGrowth && d.ruralGrowth > 0) uExceedsR++;
      else if (d.ruralGrowth > d.urbanGrowth && d.urbanGrowth > 0) rExceedsU++;
    });

    if (uExceedsR > 0) insights.push(`Districts where urban growth exceeded rural growth: ${uExceedsR}.`);
    if (rExceedsU > 0) insights.push(`Districts where rural growth exceeded urban growth: ${rExceedsU}.`);

    return insights;
  }
}

export const analysisService = new AnalysisService();

export const getCachedUrbanRuralComparison = unstable_cache(
  async () => {
    return analysisService.getUrbanRural2026Comparison();
  },
  ['urban-rural-comparison-2026-v3'],
  { revalidate: 3600, tags: ['elections'] }
);
