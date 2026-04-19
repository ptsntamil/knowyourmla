import { NextResponse } from 'next/server';
import { AVAILABLE_ELECTION_YEARS } from '@/lib/constants/elections';
import { fetchParties } from '@/services/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  
  // Available election years in the system
  const years = AVAILABLE_ELECTION_YEARS;
  
  const electionPages: { loc: string, priority: string, changefreq: string }[] = [
    // Main Elections Landing (Future-proofing)
    { loc: `${domain}/tn/elections`, priority: '0.9', changefreq: 'monthly' },
  ];

  // Add legacy standard pages
  const legacyYears = AVAILABLE_ELECTION_YEARS.filter(year => year !== '2026');
  legacyYears.forEach(year => {
    electionPages.push({ loc: `${domain}/tn/elections/${year}`, priority: '0.8', changefreq: 'yearly' });
    electionPages.push({ loc: `${domain}/tn/elections/${year}/insights`, priority: '0.7', changefreq: 'yearly' });
  });

  // Adding 2026 Pages
  const currentYear = '2026';
  electionPages.push({ loc: `${domain}/tn/elections/${currentYear}/dashboard`, priority: '1.0', changefreq: 'daily' });
  electionPages.push({ loc: `${domain}/tn/elections/${currentYear}/candidates`, priority: '0.9', changefreq: 'daily' });
  electionPages.push({ loc: `${domain}/tn/elections/${currentYear}/constituencies`, priority: '0.9', changefreq: 'daily' });
  electionPages.push({ loc: `${domain}/tn/elections/${currentYear}/parties`, priority: '0.8', changefreq: 'daily' });
  electionPages.push({ loc: `${domain}/tn/elections/${currentYear}/insights`, priority: '0.8', changefreq: 'daily' });

  // Adding 2026 Party Filter Pages
  try {
    const parties = await fetchParties();
    if (parties && parties.length > 0) {
      parties.forEach((p: any) => {
        const partyShort = p.short_name || p.PK?.replace('PARTY#', '');
        if (partyShort) {
          electionPages.push({ 
            loc: `${domain}/tn/elections/${currentYear}/dashboard?party=${partyShort}`, 
            priority: '0.6', 
            changefreq: 'daily' 
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching parties for elections sitemap:', error);
  }

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
