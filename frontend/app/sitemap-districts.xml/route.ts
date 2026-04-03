import { NextResponse } from 'next/server';
import { fetchDistricts } from '@/services/api';
import { generateXml, slugify } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  try {
    const districts = await fetchDistricts();
    const urls = (districts || []).map((d: any) => ({
      url: `${tnBaseUrl}/districts/${d.slug || slugify(d.name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })).filter(u => u.url.split('/').pop());

    const xml = generateXml(urls);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Districts sitemap data fetch error:', error);
    return new NextResponse(generateXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
