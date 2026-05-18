import { ElectionAnalyticsService } from "@/lib/services/election-analytics.service";
import { buildMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import PollingStationSummaryCards from "@/components/election/polling/PollingStationSummaryCards";
import PollingStationInsights from "@/components/election/polling/PollingStationInsights";
import PollingStationFallback from "@/components/election/polling/PollingStationFallback";
import PollingStationFAQ from "@/components/election/polling/PollingStationFAQ";
import ClientPollingView from "./ClientPollingView";
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import React from 'react';

interface PageProps {
  params: Promise<{
    slug: string;
    year: string;
  }>;
}

const service = new ElectionAnalyticsService();

export async function generateMetadata({ params }: PageProps) {
  const { slug, year } = await params;
  const constituencyId = `CONSTITUENCY#${slug}`;
  const yearNum = parseInt(year);

  const result = await service.getPollingStationResults(constituencyId, yearNum);

  if (!result) return buildMetadata({
    title: `${slug.toUpperCase()} Polling Station Results Not Available`,
    description: `Polling station wise election results for ${slug} are not available yet.`,
    path: `/tn/constituency/${slug}/election/${year}/polling-stations`
  });

  return buildMetadata({
    title: `${result.constituencyName} Polling Station Wise Results ${year} | Booth Level Vote Share`,
    description: `View ${result.constituencyName} polling station wise election results ${year} including booth level vote share, candidate performance, turnout, winning margin, and strongest polling stations.`,
    path: `/tn/constituency/${slug}/election/${year}/polling-stations`,
    keywords: [
      `${result.constituencyName} polling station results`,
      `${result.constituencyName} booth level results`,
      `${result.constituencyName} booth wise vote share`,
      "Tamil Nadu booth level results",
      "election analysis Tamil Nadu"
    ]
  });
}

export default async function PollingStationsPage({ params }: PageProps) {
  const { slug, year } = await params;
  const yearNum = parseInt(year);
  const constituencyId = `CONSTITUENCY#${slug}`;

  const result = await service.getPollingStationResults(constituencyId, yearNum);

  if (!result) {
    return (
      <div className="min-h-screen bg-page-bg py-24 px-4">
        <PollingStationFallback
          constituencyName={slug.toUpperCase().replace(/-/g, ' ')}
          constituencySlug={slug}
          year={yearNum}
        />
      </div>
    );
  }

  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "TN", item: "/tn" },
    { name: "Elections", item: "/tn/elections" },
    { name: result.constituencyName, item: `/tn/constituency/${slug}` },
    { name: `${year} Result`, item: `/tn/constituency/${slug}/election/${year}` },
    { name: "Polling Stations", item: `/tn/constituency/${slug}/election/${year}/polling-stations` },
  ];

  // Global insights for the constituency
  const globalInsights = [
    `${result.pollingStations.filter(s => s.boothType === 'STRONGHOLD').length} polling stations identified as strongholds.`,
    `Closest contest observed in PS ${result.summary.closestContestBooth} with a margin of ${result.pollingStations.find(s => s.pollingStationNo === result.summary.closestContestBooth)?.marginVotes} votes.`,
    `Highest turnout recorded at PS ${result.summary.highestTurnoutBooth} (${result.pollingStations.find(s => s.pollingStationNo === result.summary.highestTurnoutBooth)?.turnoutPercentage.toFixed(1)}%).`,
    `NOTA crossed 2% in ${result.pollingStations.filter(s => s.notaPercentage > 2).length} booths.`
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Hero Header - Premium Dark-Gold Aesthetic */}
      <header className="bg-gradient-to-br from-[#071120] via-[#0B1B2B] to-[#10263A] py-12 md:py-20 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F4B63D]/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#F4B63D]/5 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          {/* Visual Breadcrumbs - Light theme for dark background */}
          <nav className="flex items-center flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.item}>
                {index > 0 && <ChevronRight className="h-3 w-3 opacity-20" />}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="text-[#F4B63D]">{item.name}</span>
                ) : (
                  <Link href={item.item} className="hover:text-white transition-colors">
                    {item.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="space-y-6 max-w-3xl">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#F4B63D] text-[#071120] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#F4B63D]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#071120] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#071120]"></span>
                </span>
                ELECTION {year} • BOOTH LEVEL DATA
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                  <span className="text-[#F4B63D]">{result.constituencyName}</span><br />
                  Polling Station Results
                </h1>
                <div className="w-24 h-1.5 bg-[#F4B63D] rounded-full" />
              </div>

              <p className="text-white/60 font-medium text-sm md:text-lg leading-relaxed">
                Explore deep analytics for <span className="text-white font-bold">{result.constituencyName}</span> constituency. 
                Booth-level vote share, turnout trends, and candidate dominance mapped across {result.totalPollingStations} polling stations.
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-[11px] font-black text-white/40 uppercase tracking-[0.2em] bg-white/5 backdrop-blur-md border border-white/10 px-8 py-5 rounded-[2rem] shadow-2xl">
              <div className="flex flex-col gap-1 text-center">
                <span className="text-white text-xl leading-none tabular-nums">{result.totalPollingStations}</span>
                <span>Stations</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col gap-1 text-center">
                <span className="text-white text-xl leading-none tabular-nums">{(result.pollingStations.reduce((acc, s) => acc + s.totalVotes, 0) / 100000).toFixed(1)}L</span>
                <span>Total Votes</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col gap-1 text-center">
                <span className="text-white text-xl leading-none tabular-nums">{result.pollingStations[0]?.candidateResults.length || 0}</span>
                <span>Candidates</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 space-y-20">
        {/* Analytics Summary */}
        <div className="space-y-6">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
            Constituency Booth Summary
          </h2>
          <PollingStationSummaryCards
            totalPS={result.totalPollingStations}
            highestTurnout={result.summary.highestTurnoutBooth}
            lowestTurnout={result.summary.lowestTurnoutBooth}
            closestContest={result.summary.closestContestBooth}
            highestMargin={result.summary.highestMarginBooth}
            highestNota={result.summary.highestNotaBooth}
          />
        </div>

        {/* Dynamic Insights */}
        <div className="space-y-6">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
            Constituency Booth Insights
          </h2>
          <PollingStationInsights insights={globalInsights} />
        </div>

        {/* Main Data View - Client component for interactivity */}
        <ClientPollingView
          initialData={result}
          slug={slug}
          year={yearNum}
        />

        {/* Informational FAQ Section */}
        <PollingStationFAQ 
          constituencyName={result.constituencyName}
          year={yearNum}
        />
      </main>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `${result.constituencyName} Polling Station Results ${year}`,
            "description": `Detailed booth-level results for ${result.constituencyName} constituency.`,
            "itemListElement": result.pollingStations.slice(0, 10).map((ps, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": `Polling Station ${ps.pollingStationNo}`,
              "description": `Winner: ${ps.winnerName} with ${ps.winnerVoteShare.toFixed(1)}% votes.`
            }))
          })
        }}
      />
    </div>
  );
}
