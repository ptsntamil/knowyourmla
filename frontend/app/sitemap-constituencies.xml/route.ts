import { NextResponse } from 'next/server';
import { fetchConstituencies } from '@/services/api';
import { generateXml, slugify } from '@/lib/sitemap-utils';
import { AVAILABLE_ELECTION_YEARS } from '@/lib/constants/elections';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  try {
    const constituencies = await fetchConstituencies();
    const urls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];
    
    (constituencies || []).forEach((c: any) => {
      const slug = c.slug || slugify(c.name);
      if (!slug) return;

      const profileUrl = `${tnBaseUrl}/constituency/${slug}`;
      
      // Main profile page
      urls.push({
        url: profileUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      // Election result pages for each year
      AVAILABLE_ELECTION_YEARS.forEach(year => {
        urls.push({
          url: `${profileUrl}/election/${year}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    });

    const xml = generateXml(urls);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Constituency sitemap data fetch error:', error);
    return new NextResponse(generateXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
