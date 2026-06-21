import { NextResponse } from 'next/server';

export const revalidate = 86400;

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  
  const sitemaps = [
    'sitemap-static.xml',
    'sitemap-districts.xml',
    'sitemap-parties.xml',
    'sitemap-constituencies.xml',
    'sitemap-mlas.xml',
    'sitemap-elections.xml',
    'sitemap-polling-stations.xml'
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sm => `  <sitemap>
    <loc>${domain}/${sm}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new NextResponse(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
