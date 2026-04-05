import { NextResponse } from 'next/server';
import { fetchParties } from '@/services/api';
import { generateXml, slugify } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';

  try {
    const parties = await fetchParties();
    const urls = (parties || []).map((p: any) => ({
      url: `${domain}/parties/${p.slug || slugify(p.short_name || p.name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })).filter((u: any) => u.url.split('/').pop());

    const xml = generateXml(urls);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Parties sitemap data fetch error:', error);
    return new NextResponse(generateXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
