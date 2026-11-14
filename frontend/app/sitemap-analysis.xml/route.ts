import { NextResponse } from 'next/server';
import { generateXml } from '@/lib/sitemap-utils';
import { ExpenditureService } from '@/lib/services/expenditure-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla.info';

  const urls: any[] = [];

  // 1. Landing Page
  urls.push({
    url: `${domain}/tn/analysis/2026-election-expenditure`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  });

  // 2. Blog Post
  urls.push({
    url: `${domain}/news/2026-tamil-nadu-election-expenditure-party-wise-analysis`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  });

  // 3. Dynamic Party Pages
  const ELECTION_ID = "ELECTION#2026#ASSEMBLY#GENERAL";
  try {
    const reports = await ExpenditureService.getAllElectionExpenditureReports(ELECTION_ID);

    reports.forEach(report => {
      const slug = report.party_id.replace("PARTY#", "");
      urls.push({
        url: `${domain}/tn/election-expenditure/2026/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error("Error generating analysis sitemap:", error);
  }

  const xml = generateXml(urls);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
