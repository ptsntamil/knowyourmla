import React from 'react';
import { notFound } from 'next/navigation';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import DashboardHero from '@/components/election/dashboard/DashboardHero';
import ElectionSnapshotStats from '@/components/election/dashboard/ElectionSnapshotStats';
import ElectionDashboardSEOContent from '@/components/election/dashboard/ElectionDashboardSEOContent';
import ElectionDashboardFAQ from '@/components/election/dashboard/ElectionDashboardFAQ';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { commonBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildMetadata } from '@/lib/seo/metadata';

// Preview Components
import CandidatePreview from '@/components/election/tn2026/CandidatePreview';
import ConstituencyPreview from '@/components/election/tn2026/ConstituencyPreview';
import PartyPreview from '@/components/election/tn2026/PartyPreview';
import InsightsPreview from '@/components/election/tn2026/InsightsPreview';
import SpecialFocusCandidates from '@/components/election/tn2026/SpecialFocusCandidates';
import ElectionQuickView from '@/components/election/tn2026/ElectionQuickView';
import VotersCountSection from '@/components/election/dashboard/VotersCountSection';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  return buildMetadata({
    title: `Tamil Nadu Assembly ${displayYear} Dashboard | Candidate Tracking & Voter Stats`,
    description: `Central hub for tracking announced candidates and electoral statistics across Tamil Nadu for the upcoming ${displayYear}. Explore constituency-wise electorate data, candidate profiles, and party rollout strategies.`,
    path: `/tn/elections/${urlYear}/dashboard`,
    keywords: [
      `Tamil Nadu Election ${displayYear} candidates`,
      `Tamil Nadu Assembly Election ${displayYear} voter count`,
      `TN election electorate statistics ${displayYear}`,
      `TN election tracker ${displayYear}`,
      `constituency-wise candidates TN ${displayYear}`
    ]
  });
}

export default async function PreElectionDashboardPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const urlYear = year;
  const displayYear = urlYear === "202610" ? "2026 Bye-Election" : urlYear;
  const priorYear = urlYear === "202610" ? 2026 : 2021; // Simple fallback
  const data = await getTamilNaduPreElectionDashboardData(urlYear, priorYear);

  if (!data) {
    notFound();
  }

  const { stats, partyRollout, contests, candidates, insights } = data;

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Elections", item: "/tn/elections" },
          { name: `Tamil Nadu ${displayYear} Overview`, item: `/tn/elections/${urlYear}/dashboard` }
        ]}
      />

      <DashboardHero
        title={`Tamil Nadu Assembly ${displayYear}`}
        description="The central intelligence hub for the 2026 state assembly elections. Track candidates, contests, and real-time insights."
        subtitle={`Explore the list of MLA candidates contesting in the Tamil Nadu Assembly ${displayYear}. Browse constituency-wise candidates and key election insights.`}
      />

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-24">
        {/* 1. Election Snapshot Stats */}
        <div className="space-y-6">
          <section id="stats">
            <ElectionSnapshotStats stats={stats} />
          </section>
          <div className="flex justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              Data Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 1.5 Voters Count Section */}
        {stats.totalVoters && (
          <section id="electorate" className="pt-12 border-t border-slate-100">
            <VotersCountSection stats={stats} />
          </section>
        )}

        {/* 2. Quick Navigation CTA Row */}
        <section id="quick-nav">
          <ElectionQuickView urlYear={urlYear} />
        </section>

        {/* 3. Insights Preview */}
        <div className="space-y-12">
          <section id="insights-preview" className="pt-12 border-t border-slate-100">
            <InsightsPreview insights={insights} />
          </section>

          {/* Special Focus row */}
          <section id="special-focus" className="pt-12 border-t border-slate-100">
            <SpecialFocusCandidates 
              starCandidates={insights.starCandidates} 
              authorFocusCandidates={insights.authorFocusCandidates}
            />
          </section>
        </div>

        {/* 4. Candidate Preview */}
        <section id="candidates-preview" className="pt-12 border-t border-slate-100">
          <CandidatePreview candidates={candidates} urlYear={urlYear} />
        </section>

        {/* 5. Constituency Preview */}
        <section id="contests-preview" className="pt-12 border-t border-slate-100">
          <ConstituencyPreview contests={contests} />
        </section>

        {/* 6. Party Preview */}
        <section id="party-preview" className="pt-12 border-t border-slate-100">
          <PartyPreview partyRollout={partyRollout} />
        </section>

        {/* 6. SEO Content */}
        <section id="about" className="pt-16 border-t border-slate-200">
          <ElectionDashboardSEOContent insights={insights} urlYear={urlYear} />
        </section>

        {/* 7. FAQ Section */}
        <section id="faq">
          <ElectionDashboardFAQ />
        </section>

        {/* 8. Internal Linking */}
        <section id="internal-links" className="pt-16 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">States & Elections</h3>
              <ul className="space-y-2">
                <li><a href="/tn" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Tamil Nadu State Overview</a></li>
                <li><a href="/tn/elections/2021" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">2021 Assembly Results</a></li>
                <li><a href="/tn/elections" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Election Archive</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Deep Dives</h3>
              <ul className="space-y-2">
                <li><a href="/tn/elections/2026/candidates" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Candidate Explorer</a></li>
                <li><a href="/tn/elections/2026/constituencies" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Constituency Contests</a></li>
                <li><a href="/tn/elections/2026/pre-election-insights" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Candidate Insights</a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

