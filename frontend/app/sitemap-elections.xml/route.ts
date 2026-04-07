import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  
  // Available election years in the system
  const years = [2021, 2016, 2011];
  
  const electionPages = [
    // Main Elections Landing (Future-proofing)
    { loc: `${domain}/tn/elections`, priority: '0.9', changefreq: 'monthly' },
    
    // Year-specific pages
    ...years.flatMap(year => [
      { loc: `${domain}/tn/elections/${year}`, priority: '0.8', changefreq: 'yearly' },
      { loc: `${domain}/tn/elections/${year}/insights`, priority: '0.7', changefreq: 'yearly' }
    ])
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${electionPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
