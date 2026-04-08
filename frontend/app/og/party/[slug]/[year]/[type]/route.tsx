import { ImageResponse } from 'next/og';
import { fetchPartyDetails } from '@/services/api';
import { 
  generatePartyStatsCard,
  generatePartyAssetsCard,
  generatePartyCriminalCard,
  generatePartyYoungestCard,
  generatePartyGenderCard,
  OG_SIZE
} from '@/lib/seo/election-og-templates';

// export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; year: string; type: string }> }
) {
  try {
    const { slug, year, type } = await params;
    
    // Normalize year: if 'all', it will be undefined in fetchPartyDetails
    const yearParam = year === 'all' ? undefined : year;
    
    const data = await fetchPartyDetails(slug, yearParam);
    if (!data || !data.party) {
      throw new Error(`Party not found: ${slug}`);
    }

    const { party, analytics } = data;
    const partyName = party.short_name || party.name;
    const displayYear = year === 'all' ? '' : ` (${year})`;

    switch (type) {
      case 'stats':
        return new ImageResponse(
          generatePartyStatsCard(partyName, {
            totalContested: analytics.stats.totalContested,
            totalWins: analytics.stats.totalWins,
            winRate: analytics.stats.winRate
          }),
          { ...OG_SIZE }
        );

      case 'assets':
        return new ImageResponse(
          generatePartyAssetsCard(partyName, {
            crorepatiCount: analytics.assets.crorepatiCount,
            crorepatiPercentage: analytics.assets.crorepatiPercentage,
            highestName: analytics.assets.highestName || "N/A",
            highestValue: analytics.assets.highest ? `Rs. ${(analytics.assets.highest / 10000000).toFixed(1)} Cr` : "N/A"
          }),
          { ...OG_SIZE }
        );

      case 'criminal':
        return new ImageResponse(
          generatePartyCriminalCard(partyName, {
            total: analytics.criminal.total,
            percentage: analytics.criminal.percentage
          }),
          { ...OG_SIZE }
        );

      case 'youngest':
        if (analytics.age.youngest) {
          return new ImageResponse(
            generatePartyYoungestCard(partyName, {
              name: analytics.age.youngestName,
              age: analytics.age.youngest
            }),
            { ...OG_SIZE }
          );
        }
        break;

      case 'gender':
        return new ImageResponse(
          generatePartyGenderCard(partyName, {
            female: analytics.gender.female,
            femalePercentage: analytics.gender.femalePercentage
          }),
          { ...OG_SIZE }
        );

      default:
        // Default to stats card
        return new ImageResponse(
          generatePartyStatsCard(partyName, {
            totalContested: analytics.stats.totalContested,
            totalWins: analytics.stats.totalWins,
            winRate: analytics.stats.winRate
          }),
          { ...OG_SIZE }
        );
    }

    // Fallback if type matched but data missing
    return new ImageResponse(
      generatePartyStatsCard(partyName, {
        totalContested: analytics.stats.totalContested,
        totalWins: analytics.stats.totalWins,
        winRate: analytics.stats.winRate
      }),
      { ...OG_SIZE }
    );

  } catch (error) {
    console.error('Error generating Party OG image:', error);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
