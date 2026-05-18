import { NextResponse } from 'next/server';
import { fetchConstituencies } from '@/services/api';
import { generateXml, slugify } from '@/lib/sitemap-utils';
import { LATEST_ELECTION_YEAR } from '@/lib/constants/elections';
import { ElectionAnalyticsService } from '@/lib/services/election-analytics.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;
  const currentYear = LATEST_ELECTION_YEAR;
  const service = new ElectionAnalyticsService();

  try {
    const constituencies = await fetchConstituencies();
    const urls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];

    // Process all constituencies in parallel to generate precise sitemaps
    await Promise.all(
      (constituencies || []).map(async (c: any) => {
        const slug = c.slug || slugify(c.name);
        if (!slug) return;
        
        const constituencyId = c.id || `CONSTITUENCY#${slug}`;
        const baseUrl = `${tnBaseUrl}/constituency/${slug}/election/${currentYear}/polling-stations`;

        // Main Polling Stations table page
        urls.push({
          url: baseUrl,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        });

        try {
          // Fetch exact, cached active polling stations for this constituency
          const result = await service.getPollingStationResults(constituencyId, parseInt(currentYear));
          if (result && result.pollingStations) {
            result.pollingStations.forEach((station) => {
              // Ignore special 'POSTAL' polling station or other custom keys
              if (station.pollingStationNo && station.pollingStationNo !== 'POSTAL') {
                urls.push({
                  url: `${baseUrl}/polling-station/${station.pollingStationNo}`,
                  lastModified: new Date(),
                  changeFrequency: 'weekly',
                  priority: 0.6,
                });
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching polling stations for sitemap of ${slug}:`, err);
        }
      })
    );

    const xml = generateXml(urls);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Polling stations sitemap data fetch error:', error);
    return new NextResponse(generateXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
