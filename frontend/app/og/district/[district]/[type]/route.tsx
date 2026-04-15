import { ImageResponse } from 'next/og';
import { fetchDistrictInsights } from '@/services/api';
import { 
  generateDistrictDominantPartyCard,
  generateDistrictRichestMLACard,
  generateDistrictYoungestMLACard,
  generateDistrictWomenStatsCard,
  generateDistrictProfileCard,
  OG_SIZE
} from '@/lib/seo/election-og-templates';

// export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ district: string; type: string }> }
) {
  try {
    const { district, type } = await params;
    const districtId = `DISTRICT#${district.toLowerCase()}`;
    const districtName = district.charAt(0).toUpperCase() + district.slice(1).toLowerCase();

    const data = await fetchDistrictInsights(districtId);
    if (!data || !data.insights) {
      throw new Error(`No insights found for district ${district}`);
    }

    const { insights, mlas } = data;

    switch (type) {
      case 'dominant-party':
        if (insights.dominantParty && insights.dominantParty.party) {
          return new ImageResponse(
            generateDistrictDominantPartyCard(districtName, {
              party: insights.dominantParty.party,
              seats: insights.dominantParty.seats,
              totalSeats: insights.dominantParty.totalSeats
            }),
            { ...OG_SIZE }
          );
        }
        // Fallback to profile if no dominant party data
        break;

      case 'richest-mla':
        if (insights.richestMla) {
          return new ImageResponse(
            generateDistrictRichestMLACard(districtName, {
              name: insights.richestMla.name,
              formattedAssets: insights.richestMla.formattedAssets,
              partyShort: insights.richestMla.partyShort,
              partyColor: insights.richestMla.partyColor
            }),
            { ...OG_SIZE }
          );
        }
        break;

      case 'youngest-mla':
        if (insights.youngestMla && insights.youngestMla.age !== null) {
          return new ImageResponse(
            generateDistrictYoungestMLACard(districtName, {
              name: insights.youngestMla.name,
              age: insights.youngestMla.age,
              partyShort: insights.youngestMla.partyShort,
              partyColor: insights.youngestMla.partyColor
            }),
            { ...OG_SIZE }
          );
        }
        break;

      case 'women':
        if (insights.genderSplit) {
          return new ImageResponse(
            generateDistrictWomenStatsCard(districtName, insights.genderSplit.female, mlas.length),
            { ...OG_SIZE }
          );
        }
        break;

      case 'profile':
      default:
        // Build top parties for profile card
        const partyCounts: Record<string, { count: number; color?: string }> = {};
        mlas.forEach(mla => {
          if (!partyCounts[mla.partyShort]) {
            partyCounts[mla.partyShort] = { count: 0, color: mla.partyColor };
          }
          partyCounts[mla.partyShort].count++;
        });

        const topParties = Object.entries(partyCounts)
          .map(([party, data]) => ({ party, seats: data.count, color: data.color }))
          .sort((a, b) => b.seats - a.seats);

        return new ImageResponse(
          generateDistrictProfileCard(districtName, topParties),
          { ...OG_SIZE }
        );
    }

    // Default fallback if a specific type failed but we are still here
    const partyCountsFallback: Record<string, { count: number; color?: string }> = {};
    mlas.forEach(mla => {
      if (!partyCountsFallback[mla.partyShort]) {
        partyCountsFallback[mla.partyShort] = { count: 0, color: mla.partyColor };
      }
      partyCountsFallback[mla.partyShort].count++;
    });

    const topPartiesFallback = Object.entries(partyCountsFallback)
      .map(([party, data]) => ({ party, seats: data.count, color: data.color }))
      .sort((a, b) => b.seats - a.seats);

    return new ImageResponse(
      generateDistrictProfileCard(districtName, topPartiesFallback),
      { ...OG_SIZE }
    );

  } catch (error) {
    console.error('Error generating District OG image:', error);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
