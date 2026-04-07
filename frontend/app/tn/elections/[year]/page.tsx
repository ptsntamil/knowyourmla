import React from 'react';
import { notFound } from 'next/navigation';
import { ElectionAnalyticsService } from '@/lib/services/election-analytics.service';
import ElectionHero from '@/components/election/ElectionHero';
import ElectionSnapshotCards from '@/components/election/ElectionSnapshotCards';
import SeatsByPartyChart from '@/components/election/SeatsByPartyChart';
import VoteShareChart from '@/components/election/VoteShareChart';
import ElectionInsights from '@/components/election/insights/ElectionInsights';
import ConstituencyResultsExplorer from '@/components/election/ConstituencyResultsExplorer';
import FAQSection from '@/components/seo/FAQSection';
import CoverImage from '@/components/CoverImage';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  const yearNum = parseInt(year);

  return buildMetadata({
    title: `Tamil Nadu Assembly Election ${year} Results | Seats, Vote Share & Winners`,
    description: `Complete results of the ${year} Tamil Nadu Assembly Election. Explore seats won by DMK, AIADMK and other parties, vote share analytics, and constituency-wise winner list with margins.`,
    path: `/tn/elections/${year}`,
    image: `/tn/elections/${year}/opengraph-image?type=summary`,
    keywords: [
      `Tamil Nadu Election ${year} Results`,
      `TN Assembly Election ${year}`,
      `${year} TN Election Seats by Party`,
      `Tamil Nadu ${year} Vote Share`,
      `Constituency Winners Tamil Nadu ${year}`
    ]
  });
}

export async function generateStaticParams() {
  return [
    { year: '2021' },
    { year: '2016' },
    { year: '2011' }
  ];
}

export default async function ElectionPage({ params }: PageProps) {
  const { year } = await params;
  const yearNum = parseInt(year);

  if (isNaN(yearNum)) {
    notFound();
  }

  const electionService = new ElectionAnalyticsService();
  const data = await electionService.getElectionOverview(yearNum);

  if (!data) {
    notFound();
  }

  const { summary, seatsByParty, voteShareByParty, constituencyResults, insights, faq } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema 
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections/2021" }, // Using 2021 as a default for parent if needed
          { name: `${year} Results`, item: `/tn/elections/${year}` }
        ]} 
      />

      <CoverImage
        title={`${summary.stateName} Election ${year}`}
        subtitle={summary.summarySentence}
      >
        <ElectionHero summary={summary} />
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        {/* 1. Snapshot Cards */}
        <section className="space-y-12">
          <ElectionSnapshotCards summary={summary} />
        </section>

        {/* 2. Charts Section */}
        <section className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <SeatsByPartyChart data={seatsByParty} />
          <VoteShareChart data={voteShareByParty} />
        </section>

        {/* 3. Election Insights */}
        <section id="insights" className="pt-24 border-t border-slate-100">
          <ElectionInsights insights={insights} year={yearNum} isTeaser={true} />
        </section>

        {/* 4. Results Table */}
        <section id="results" className="pt-24 border-t border-slate-100">
          <ConstituencyResultsExplorer results={constituencyResults} year={yearNum} />
        </section>

        {/* 5. FAQ Section */}
        <section id="faq" className="pt-24 border-t border-slate-100">
          <FAQSection faqs={faq} />
        </section>

        {/* Footer CTA */}
        <div className="bg-brand-dark rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Detailed MLA Profiles</h2>
            <p className="text-slate-400 font-medium">Want to know more about the individual representatives from the {year} assembly?</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <a
              href="/tn/mla/list"
              className="w-full sm:w-auto bg-brand-gold text-brand-dark font-black px-10 py-4 rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-white transition-all"
            >
              Explore MLA List
            </a>
            <a
              href="/parties"
              className="w-full sm:w-auto bg-white/10 text-white font-black px-10 py-4 rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all border border-white/10"
            >
              View Party Analytics
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
