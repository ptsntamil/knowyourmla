import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ElectionAnalyticsService } from '@/lib/services/election-analytics.service';
import ElectionInsightsHero from '@/components/election/insights/ElectionInsightsHero';
import QuickInsightSnapshots from '@/components/election/insights/QuickInsightSnapshots';
import ElectionInsights from '@/components/election/insights/ElectionInsights';
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
    title: `Tamil Nadu Election ${year} Results Insights | Analysis, Stats & Highlights`,
    description: `Deep analytical insights for the ${year} Tamil Nadu Assembly Election. Explore closest contests, biggest victories, turnout patterns, and contestant demographics including richest and youngest candidates.`,
    path: `/tn/elections/${year}/insights`,
    image: `/tn/elections/${year}/opengraph-image?type=closest`,
    keywords: [
      `Tamil Nadu Election ${year} Insights`,
      `TN Election ${year} Analysis`,
      `Richest Candidates TN ${year}`,
      `Closest Contests TN ${year}`,
      `Women Winners Tamil Nadu ${year}`
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

export default async function ElectionInsightsPage({ params }: PageProps) {
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

  const { summary, insights } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema 
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections/2021" },
          { name: `${year} Results`, item: `/tn/elections/${year}` },
          { name: "Insights", item: `/tn/elections/${year}/insights` }
        ]} 
      />

      <ElectionInsightsHero 
        year={yearNum} 
        stateName={summary.stateName} 
      />

      <main className="max-w-7xl mx-auto px-4 pb-32 space-y-24">
        {/* 1. Quick Snapshots */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
             <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Quick Highlights</h2>
          </div>
          <QuickInsightSnapshots insights={insights} />
        </section>

        {/* 2. Detailed Grid */}
        <section className="pt-12 border-t border-slate-100">
           <ElectionInsights insights={insights} year={yearNum} />
        </section>

        {/* 3. Footer Navigation CTA */}
        <section className="bg-brand-dark rounded-[3.5rem] p-12 md:p-20 text-center space-y-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-gold/10 via-transparent to-transparent opacity-50" />
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
              Deeper Discovery
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Explore the individual profiles, educational qualifications, and financial backgrounds of the 
              representatives elected in {year}.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
            <Link 
              href="/tn/mla/list"
              className="w-full sm:w-auto bg-brand-gold text-brand-dark font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] text-xs hover:bg-white transition-all shadow-xl shadow-brand-gold/20"
            >
              Explore MLA List
            </Link>
            <Link 
              href={`/tn/elections/${year}`}
              className="w-full sm:w-auto bg-white/10 text-white font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all border border-white/10"
            >
              Back to Main Results
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
