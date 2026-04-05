import { NextResponse } from 'next/server';
import { fetchMLAs } from '@/services/api';
import { generateXml } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  try {
    const years = [2021, 2016, 2011];
    const results = await Promise.allSettled(years.map(year => fetchMLAs(year)));
    
    let allMlas: any[] = [];
    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        allMlas = [...allMlas, ...(res.value?.mlas || [])];
      } else {
        console.error(`MLA sitemap data fetch error for ${years[index]}:`, res.reason);
      }
    });

    // Ensure uniqueness by slug
    const uniqueMlas = Array.from(new Map(allMlas.map(m => [m.slug, m])).values());

    const urls = (uniqueMlas || []).map((m: any) => ({
      url: `${tnBaseUrl}/mla/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })).filter((u: any) => u.url.split('/').pop());

    const xml = generateXml(urls);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error(`MLA sitemap data fetch error:`, error);
    return new NextResponse(generateXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
