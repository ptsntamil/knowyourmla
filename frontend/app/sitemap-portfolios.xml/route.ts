import { NextResponse } from 'next/server';
import { PortfolioService } from '@/lib/services/portfolio.service';
import { generateXml } from '@/lib/sitemap-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  try {
    const portfolioService = new PortfolioService();
    const portfolios = await portfolioService.getAllPortfolios();
    const urls: { url: string; lastModified: Date; changeFrequency: string; priority: number }[] = [];
    
    (portfolios || []).forEach((p: any) => {
      const slug = p.normalized_name;
      if (!slug) return;

      urls.push({
        url: `${tnBaseUrl}/portfolios/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
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
    console.error('Portfolio sitemap data fetch error:', error);
    return new NextResponse(generateXml([]), {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
