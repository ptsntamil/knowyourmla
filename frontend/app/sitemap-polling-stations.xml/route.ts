import { NextResponse } from 'next/server';
import { fetchConstituencies } from '@/services/api';
import { generateXml, slugify } from '@/lib/sitemap-utils';
import { LATEST_ELECTION_YEAR } from '@/lib/constants/elections';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;
  const currentYear = LATEST_ELECTION_YEAR;

  try {
    const constituencies = await fetchConstituencies();
    const urls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];

    (constituencies || []).forEach((c: any) => {
      const slug = c.slug || slugify(c.name);
      if (!slug) return;
      
      const baseUrl = `${tnBaseUrl}/constituency/${slug}/election/${currentYear}/polling-stations`;

      // Main Polling Stations table page
      urls.push({
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });

      // Individual Polling Station detail pages (assuming 1-350 as a safe range for generic generation)
      // Note: For a perfectly accurate sitemap, we should fetch the exact number of stations from DynamoDB for each constituency.
      // However, to keep the sitemap generation fast and avoid huge DB loads, we can generate a safe range.
      for (let i = 1; i <= 350; i++) {
        urls.push({
          url: `${baseUrl}/polling-station/${i}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    });

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
