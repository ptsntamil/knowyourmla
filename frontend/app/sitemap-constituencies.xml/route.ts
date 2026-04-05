import { NextResponse } from 'next/server';
import { fetchConstituencies } from '@/services/api';
import { generateXml, slugify } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  try {
    const constituencies = await fetchConstituencies();
    const urls = (constituencies || []).map((c: any) => ({
      url: `${tnBaseUrl}/constituency/${c.slug || slugify(c.name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })).filter(u => u.url.split('/').pop());

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
