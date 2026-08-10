import { unstable_cache } from "next/cache";
import { VoterTrendService } from "./voter-trend.service";
import { CandidateRepository } from "../repositories/candidate.repository";
import { PartyRepository } from "../repositories/party.repository";

export interface TvkConstituencyData {
  id: string;
  name: string;
  slug: string;
  district_name: string;
  votes_2021: number;
  votes_2026: number;
  votes_added: number;
  vote_growth_percentage: number;
  tvk_votes: number;
  tvk_vote_share: number;
  winner_name: string;
  winner_party: string;
  winning_margin: number;
}

export interface TvkAnalysisData {
  constituencies: TvkConstituencyData[];
  metrics: {
    average_tvk_share: number;
    average_vote_growth: number;
    correlation_share_vs_growth: number;
    correlation_share_vs_added: number;
    highest_tvk_share: TvkConstituencyData | null;
    highest_vote_growth: TvkConstituencyData | null;
    quadrants: {
      high_tvk_high_growth: TvkConstituencyData[];
      high_tvk_low_growth: TvkConstituencyData[];
      low_tvk_high_growth: TvkConstituencyData[];
      low_tvk_low_growth: TvkConstituencyData[];
    };
    insights: string[];
  };
}

export class TvkAnalysisService {
  private voterTrendService: VoterTrendService;
  private candidateRepo: CandidateRepository;
  private partyRepo: PartyRepository;

  constructor() {
    this.voterTrendService = new VoterTrendService();
    this.candidateRepo = new CandidateRepository();
    this.partyRepo = new PartyRepository();
  }

  /**
   * Calculates the Pearson Correlation Coefficient between two arrays.
   */
  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);
    const sumXY = x.reduce((sum, curr, i) => sum + curr * y[i], 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  async getTvkCorrelationAnalysis(): Promise<TvkAnalysisData> {
    return unstable_cache(
      async () => {
        // 1. Get base voter trend data
        const trendData = await this.voterTrendService.getVoterTrendAnalysis();
        const baseConstituencies = trendData.constituencies;

        // 2. Resolve TVK Party ID
        const tvkParty = await this.partyRepo.getPartyBySlugDirect("tamilagavettrikazhagam");
        const tvkPartyId = tvkParty ? tvkParty.PK : "PARTY#tamilagavettrikazhagam";

        // 3. Fetch candidates for all constituencies concurrently
        const constituenciesData: TvkConstituencyData[] = [];
        const fetchPromises = baseConstituencies.map(async (bc) => {
          // Exclude edge cases with zero votes just in case
          if (bc.votes_polled_2026 === 0) return null;

          const candidates = await this.candidateRepo.getCandidatesByConstituencyAndYear(bc.id, 2026);
          
          let tvkVotes = 0;
          let tvkVoteShare = 0;
          let winnerName = "Unknown";
          let winnerParty = "Unknown";
          let winningMargin = 0;

          if (candidates && candidates.length > 0) {
            // Find TVK candidate
            const tvkCandidate = candidates.find((c: any) => c.party_id === tvkPartyId);
            if (tvkCandidate) {
              tvkVotes = tvkCandidate.total_votes || 0;
              tvkVoteShare = tvkCandidate.vote_percent || 
                (bc.votes_polled_2026 > 0 ? (tvkVotes / bc.votes_polled_2026) * 100 : 0);
            }

            // Find Winner
            const winner = candidates.find((c: any) => c.is_winner);
            if (winner) {
              winnerName = winner.candidate_name;
              winnerParty = winner.party_id.replace("PARTY#", "").toUpperCase();
              winningMargin = winner.winning_margin || 0;
            }
          }

          return {
            id: bc.id,
            name: bc.name,
            slug: bc.slug,
            district_name: bc.district_name,
            votes_2021: bc.votes_polled_2021,
            votes_2026: bc.votes_polled_2026,
            votes_added: bc.additional_votes,
            vote_growth_percentage: bc.vote_growth_percentage,
            tvk_votes: tvkVotes,
            tvk_vote_share: parseFloat(tvkVoteShare.toFixed(2)),
            winner_name: winnerName,
            winner_party: winnerParty,
            winning_margin: winningMargin,
          };
        });

        const results = await Promise.all(fetchPromises);
        results.forEach((r) => {
          if (r) constituenciesData.push(r);
        });

        // 4. Compute correlations
        const xShares = constituenciesData.map((c) => c.tvk_vote_share);
        const yGrowths = constituenciesData.map((c) => c.vote_growth_percentage);
        const yAdded = constituenciesData.map((c) => c.votes_added);

        const correlation_share_vs_growth = this.calculatePearsonCorrelation(xShares, yGrowths);
        const correlation_share_vs_added = this.calculatePearsonCorrelation(xShares, yAdded);

        // 5. Quadrant Analysis
        const medianTvkShare = xShares.sort((a, b) => a - b)[Math.floor(xShares.length / 2)] || 0;
        const medianGrowth = yGrowths.sort((a, b) => a - b)[Math.floor(yGrowths.length / 2)] || 0;

        const quadrants = {
          high_tvk_high_growth: constituenciesData.filter(c => c.tvk_vote_share >= medianTvkShare && c.vote_growth_percentage >= medianGrowth).sort((a, b) => b.tvk_vote_share - a.tvk_vote_share),
          high_tvk_low_growth: constituenciesData.filter(c => c.tvk_vote_share >= medianTvkShare && c.vote_growth_percentage < medianGrowth).sort((a, b) => b.tvk_vote_share - a.tvk_vote_share),
          low_tvk_high_growth: constituenciesData.filter(c => c.tvk_vote_share < medianTvkShare && c.vote_growth_percentage >= medianGrowth).sort((a, b) => a.tvk_vote_share - b.tvk_vote_share),
          low_tvk_low_growth: constituenciesData.filter(c => c.tvk_vote_share < medianTvkShare && c.vote_growth_percentage < medianGrowth).sort((a, b) => a.tvk_vote_share - b.tvk_vote_share),
        };

        // 6. Metrics & Insights
        const average_tvk_share = xShares.length > 0 ? xShares.reduce((a, b) => a + b, 0) / xShares.length : 0;
        const average_vote_growth = yGrowths.length > 0 ? yGrowths.reduce((a, b) => a + b, 0) / yGrowths.length : 0;
        
        const sortedByTvk = [...constituenciesData].sort((a, b) => b.tvk_vote_share - a.tvk_vote_share);
        const sortedByGrowth = [...constituenciesData].sort((a, b) => b.vote_growth_percentage - a.vote_growth_percentage);

        const insights: string[] = [];
        
        if (Math.abs(correlation_share_vs_growth) < 0.3) {
          insights.push(`The correlation coefficient of ${correlation_share_vs_growth.toFixed(2)} indicates no statistically significant relationship between TVK's vote share and the percentage increase in voter turnout.`);
        } else if (correlation_share_vs_growth >= 0.3) {
          insights.push(`There is a moderate positive correlation (${correlation_share_vs_growth.toFixed(2)}) between TVK's vote share and the growth in actual votes polled.`);
        } else {
          insights.push(`There is a negative correlation (${correlation_share_vs_growth.toFixed(2)}) indicating that areas with higher TVK share actually saw lower overall vote growth.`);
        }

        const highTvkAvgGrowth = quadrants.high_tvk_high_growth.length > 0 ? 
          quadrants.high_tvk_high_growth.reduce((sum, c) => sum + c.vote_growth_percentage, 0) / quadrants.high_tvk_high_growth.length : 0;
        
        insights.push(`In the ${quadrants.high_tvk_high_growth.length} constituencies where TVK performed above the state median, the average vote growth was ${highTvkAvgGrowth.toFixed(2)}%.`);

        return {
          constituencies: constituenciesData,
          metrics: {
            average_tvk_share: parseFloat(average_tvk_share.toFixed(2)),
            average_vote_growth: parseFloat(average_vote_growth.toFixed(2)),
            correlation_share_vs_growth: parseFloat(correlation_share_vs_growth.toFixed(4)),
            correlation_share_vs_added: parseFloat(correlation_share_vs_added.toFixed(4)),
            highest_tvk_share: sortedByTvk[0] || null,
            highest_vote_growth: sortedByGrowth[0] || null,
            quadrants,
            insights
          }
        };
      },
      ["tvk-correlation-analysis-v2"],
      { revalidate: 86400, tags: ["tvk", "constituencies", "analysis"] }
    )();
  }
}
