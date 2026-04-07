import { ImageResponse } from 'next/og';
import { ElectionAnalyticsService } from '@/lib/services/election-analytics.service';
import {
  generateElectionSummaryCard,
  generateWinningPartyCard,
  generateClosestContestsCard,
  generateBiggestVictoriesCard,
  generateTurnoutCard,
  generateWomenRepresentationCard,
  generateRichestContestantsCard,
  generateYoungestContestantsCard,
  OG_SIZE
} from '@/lib/seo/election-og-templates';

export const alt = 'Election Insights';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image({ 
  params,
  request 
}: { 
  params: Promise<{ year: string }>;
  request: Request;
}) {
  const { year } = await params;
  const yearNum = parseInt(year, 10);
  
  if (isNaN(yearNum)) {
    return new Response('Invalid year', { status: 400 });
  }

  // Get search params for dynamic card typing
  const { searchParams } = new URL(request.url);
  const cardType = searchParams.get('type') || 'summary';

  const electionService = new ElectionAnalyticsService();
  
  try {
    const data = await electionService.getElectionOverview(yearNum);
    
    if (!data) {
      throw new Error(`No data found for election year ${yearNum}`);
    }

    const { summary, seatsByParty, insights } = data;

    // Route to the appropriate template based on 'type' query param
    switch (cardType) {
      case 'winner':
        return new ImageResponse(generateWinningPartyCard(summary, seatsByParty), { ...size });

      case 'closest':
        return new ImageResponse(generateClosestContestsCard(yearNum, insights.closestContests), { ...size });

      case 'landslide':
        return new ImageResponse(generateBiggestVictoriesCard(yearNum, insights.biggestVictories), { ...size });

      case 'turnout':
        return new ImageResponse(generateTurnoutCard(yearNum, insights.highestTurnout), { ...size });

      case 'women':
        return new ImageResponse(generateWomenRepresentationCard(yearNum, insights.womenRepresentation), { ...size });

      case 'richest':
        return new ImageResponse(generateRichestContestantsCard(yearNum, insights.richestContestants), { ...size });

      case 'youngest':
        return new ImageResponse(generateYoungestContestantsCard(yearNum, insights.youngestContestants), { ...size });

      case 'summary':
      default:
        // Default to the overall election summary card
        return new ImageResponse(generateElectionSummaryCard(summary, seatsByParty), { ...size });
    }

  } catch (error) {
    console.error('Error generating Election OG image:', error);
    
    // Fallback minimalistic card
    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          fontFamily: 'sans-serif',
        }}>
          <h1 style={{ fontSize: '64px', fontWeight: 900, color: '#0f172a', marginBottom: '20px' }}>
            Tamil Nadu Election {year}
          </h1>
          <p style={{ fontSize: '24px', color: '#64748b', fontWeight: 700 }}>
            KnowYourMLA
          </p>
        </div>
      ),
      { ...size }
    );
  }
}
