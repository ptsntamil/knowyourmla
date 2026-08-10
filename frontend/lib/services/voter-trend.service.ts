import { ConstituencyRepository } from "../repositories/constituency.repository";
import { unstable_cache } from "next/cache";

export interface VoterTrendConstituency {
  id: string;
  name: string;
  slug: string;
  district_id: string;
  district_name: string;
  total_electors_2021: number;
  votes_polled_2021: number;
  turnout_percentage_2021: number;
  total_electors_2026: number;
  votes_polled_2026: number;
  turnout_percentage_2026: number;
  turnout_change: number;
  additional_votes: number;
  vote_growth_percentage: number;
  elector_change: number;
}

export interface DistrictTurnoutSummary {
  district_name: string;
  average_turnout_2021: number;
  average_turnout_2026: number;
  total_votes_added: number;
  average_vote_growth: number;
  total_votes_polled_2021: number;
  total_votes_polled_2026: number;
  total_electorate: number;
  number_of_constituencies: number;
}

export interface VoterTrendAnalysis {
  constituencies: VoterTrendConstituency[];
  district_summaries: DistrictTurnoutSummary[];
  insights: {
    top_added_votes_constituencies: VoterTrendConstituency[];
    top_vote_growth_constituencies: VoterTrendConstituency[];
    largest_vote_decline: VoterTrendConstituency | null;
    district_highest_growth: DistrictTurnoutSummary | null;
    district_lowest_growth: DistrictTurnoutSummary | null;
    average_vote_growth: number;
    median_vote_growth: number;
    statewide_votes_added: number;
    statewide_vote_growth_percentage: number;
    votes_growth_distribution_buckets: { name: string; count: number }[];
    total_added_electors: number;
    average_turnout_2021: number;
    average_turnout_2026: number;
  };
}

export class VoterTrendService {
  private repository: ConstituencyRepository;

  constructor(repository?: ConstituencyRepository) {
    this.repository = repository || new ConstituencyRepository();
  }

  async getVoterTrendAnalysis(): Promise<VoterTrendAnalysis> {
    return unstable_cache(
      async () => {
        const rawConstituencies = await this.repository.getAllConstituencies();
        
        const constituencies: VoterTrendConstituency[] = [];
        
        for (const c of rawConstituencies) {
          const stats2021 = c.statistics?.["2021"] || {};
          const stats2026 = c.statistics?.["2026"] || {};
          
          const turnout2021 = stats2021.poll_percentage || 0;
          const turnout2026 = stats2026.poll_percentage || 0;
          const votes2021 = stats2021.total_votes_polled || 0;
          const votes2026 = stats2026.total_votes_polled || 0;
          const electors2021 = stats2021.total_electors || 0;
          const electors2026 = stats2026.total_electors || 0;
          
          if (turnout2021 > 0 || turnout2026 > 0) {
            const districtName = c.district_id 
              ? c.district_id.replace("DISTRICT#", "").replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
              : "Unknown";

            const turnoutChange = parseFloat((turnout2026 - turnout2021).toFixed(2));
            const additional_votes = votes2026 - votes2021;
            const vote_growth_percentage = votes2021 > 0 ? parseFloat(((additional_votes / votes2021) * 100).toFixed(2)) : 0;
            
            constituencies.push({
              id: c.PK,
              name: c.name,
              slug: c.normalized_name || c.PK.replace("CONSTITUENCY#", ""),
              district_id: c.district_id,
              district_name: districtName,
              total_electors_2021: electors2021,
              votes_polled_2021: votes2021,
              turnout_percentage_2021: turnout2021,
              total_electors_2026: electors2026,
              votes_polled_2026: votes2026,
              turnout_percentage_2026: turnout2026,
              turnout_change: turnoutChange,
              additional_votes,
              vote_growth_percentage,
              elector_change: electors2026 - electors2021,
            });
          }
        }
        
        // Default sort by additional votes descending
        constituencies.sort((a, b) => b.additional_votes - a.additional_votes);
        
        // District aggregations
        const districtMap = new Map<string, {
          t2021: number[], t2026: number[], 
          v2021: number, v2026: number,
          e2021: number, e2026: number
        }>();
        
        let stateTotalTurnout2021 = 0;
        let stateTotalTurnout2026 = 0;
        let totalVotes2021 = 0;
        let totalVotes2026 = 0;
        let totalElectors2021 = 0;
        let totalElectors2026 = 0;

        for (const c of constituencies) {
          if (!districtMap.has(c.district_name)) {
            districtMap.set(c.district_name, { t2021: [], t2026: [], v2021: 0, v2026: 0, e2021: 0, e2026: 0 });
          }
          const d = districtMap.get(c.district_name)!;
          d.t2021.push(c.turnout_percentage_2021);
          d.t2026.push(c.turnout_percentage_2026);
          d.v2021 += c.votes_polled_2021;
          d.v2026 += c.votes_polled_2026;
          d.e2021 += c.total_electors_2021;
          d.e2026 += c.total_electors_2026;
          
          stateTotalTurnout2021 += c.turnout_percentage_2021;
          stateTotalTurnout2026 += c.turnout_percentage_2026;
          totalVotes2021 += c.votes_polled_2021;
          totalVotes2026 += c.votes_polled_2026;
          totalElectors2021 += c.total_electors_2021;
          totalElectors2026 += c.total_electors_2026;
        }
        
        const district_summaries: DistrictTurnoutSummary[] = Array.from(districtMap.entries()).map(([name, data]) => {
          const avg2021 = data.t2021.reduce((sum, v) => sum + v, 0) / data.t2021.length;
          const avg2026 = data.t2026.reduce((sum, v) => sum + v, 0) / data.t2026.length;
          const total_votes_added = data.v2026 - data.v2021;
          const average_vote_growth = data.v2021 > 0 ? parseFloat(((total_votes_added / data.v2021) * 100).toFixed(2)) : 0;

          return {
            district_name: name,
            average_turnout_2021: parseFloat(avg2021.toFixed(2)),
            average_turnout_2026: parseFloat(avg2026.toFixed(2)),
            total_votes_added,
            average_vote_growth,
            total_votes_polled_2021: data.v2021,
            total_votes_polled_2026: data.v2026,
            total_electorate: data.e2026,
            number_of_constituencies: data.t2021.length
          };
        }).sort((a, b) => b.total_votes_added - a.total_votes_added);

        // Insights
        const top_added_votes_constituencies = [...constituencies].sort((a, b) => b.additional_votes - a.additional_votes).slice(0, 20);
        const top_vote_growth_constituencies = [...constituencies].sort((a, b) => b.vote_growth_percentage - a.vote_growth_percentage).slice(0, 20);
        
        const constituencies_by_decline = [...constituencies].sort((a, b) => a.additional_votes - b.additional_votes);
        const largest_vote_decline = constituencies_by_decline.length > 0 && constituencies_by_decline[0].additional_votes < 0 ? constituencies_by_decline[0] : null;
        
        const count = constituencies.length;
        
        // Median calculation for vote growth
        const sortedGrowths = constituencies.map(c => c.vote_growth_percentage).sort((a, b) => a - b);
        const mid = Math.floor(sortedGrowths.length / 2);
        let median_vote_growth = 0;
        if (sortedGrowths.length > 0) {
          median_vote_growth = sortedGrowths.length % 2 !== 0 
            ? sortedGrowths[mid] 
            : (sortedGrowths[mid - 1] + sortedGrowths[mid]) / 2;
        }

        const statewide_votes_added = totalVotes2026 - totalVotes2021;
        const statewide_vote_growth_percentage = totalVotes2021 > 0 ? parseFloat(((statewide_votes_added / totalVotes2021) * 100).toFixed(2)) : 0;
        const average_vote_growth = count ? parseFloat((constituencies.reduce((sum, c) => sum + c.vote_growth_percentage, 0) / count).toFixed(2)) : 0;

        // Histogram buckets logic
        const buckets = {
          "< -10%": 0,
          "-10 to 0%": 0,
          "0-5%": 0,
          "5-10%": 0,
          "10-15%": 0,
          "15-20%": 0,
          "20%+": 0
        };

        for (const c of constituencies) {
          const g = c.vote_growth_percentage;
          if (g < -10) buckets["< -10%"]++;
          else if (g < 0) buckets["-10 to 0%"]++;
          else if (g < 5) buckets["0-5%"]++;
          else if (g < 10) buckets["5-10%"]++;
          else if (g < 15) buckets["10-15%"]++;
          else if (g < 20) buckets["15-20%"]++;
          else buckets["20%+"]++;
        }

        const votes_growth_distribution_buckets = Object.entries(buckets).map(([name, count]) => ({ name, count }));

        const districts_by_growth = [...district_summaries].sort((a, b) => b.average_vote_growth - a.average_vote_growth);

        return {
          constituencies,
          district_summaries,
          insights: {
            top_added_votes_constituencies,
            top_vote_growth_constituencies,
            largest_vote_decline,
            district_highest_growth: districts_by_growth.length > 0 ? districts_by_growth[0] : null,
            district_lowest_growth: districts_by_growth.length > 0 ? districts_by_growth[districts_by_growth.length - 1] : null,
            average_vote_growth: parseFloat(average_vote_growth.toFixed(2)),
            median_vote_growth: parseFloat(median_vote_growth.toFixed(2)),
            statewide_votes_added,
            statewide_vote_growth_percentage,
            votes_growth_distribution_buckets,
            total_added_electors: totalElectors2026 - totalElectors2021,
            average_turnout_2021: count ? parseFloat((stateTotalTurnout2021 / count).toFixed(2)) : 0,
            average_turnout_2026: count ? parseFloat((stateTotalTurnout2026 / count).toFixed(2)) : 0,
          }
        };
      },
      ["voter-trend-analysis"],
      { revalidate: 86400, tags: ["voter-trend", "constituencies"] }
    )();
  }
}

