import { NextResponse } from 'next/server';
import { generateXml } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  const staticPages = [
    { url: domain, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: tnBaseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${tnBaseUrl}/mla/list`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${domain}/parties`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${tnBaseUrl}/news/tamil-nadu-mlas-100-percent-attendance-2021-2026`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${tnBaseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${tnBaseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${tnBaseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const xml = generateXml(staticPages);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
