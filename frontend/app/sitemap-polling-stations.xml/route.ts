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
