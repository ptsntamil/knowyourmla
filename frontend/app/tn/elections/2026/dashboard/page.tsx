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
import ElectionQuickView from '@/components/election/tn2026/ElectionQuickView';

export async function generateMetadata() {
  const year = 2026;
  return buildMetadata({
    title: `Tamil Nadu Assembly Election ${year} Dashboard | Candidate Tracking & Hub`,
    description: `Central hub for tracking announced candidates, constituency contests, party rollout strategies, and real-time election insights across Tamil Nadu for the upcoming ${year} Assembly Election.`,
    path: `/tn/elections/${year}/dashboard`,
    keywords: [
      `Tamil Nadu Election ${year} candidates`,
      `Tamil Nadu Assembly Election ${year} hub`,
      `TN election tracker ${year}`,
      `constituency-wise candidates TN ${year}`
    ]
  });
}

export default async function PreElectionDashboardPage() {
  const year = 2026;
  const data = await getTamilNaduPreElectionDashboardData();

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
          { name: `Tamil Nadu ${year} Overview`, item: `/tn/elections/${year}/dashboard` }
        ]}
      />

      <DashboardHero
        title={`Tamil Nadu Assembly Election ${year}`}
        description="The central intelligence hub for the 2026 state assembly elections. Track candidates, contests, and real-time insights."
        subtitle="Track candidates, constituency contests, party rollout, and key election insights for Tamil Nadu Assembly Election 2026."
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

        {/* 2. Quick Navigation CTA Row */}
        <section id="quick-nav">
          <ElectionQuickView />
        </section>

        {/* 3. Insights Preview */}
        <section id="insights-preview" className="pt-12 border-t border-slate-100">
          <InsightsPreview insights={insights} />
        </section>

        {/* 4. Candidate Preview */}
        <section id="candidates-preview" className="pt-12 border-t border-slate-100">
          <CandidatePreview candidates={candidates} />
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
          <ElectionDashboardSEOContent />
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
                <li><a href="/tn/elections/2026/parties" className="text-sm font-medium text-slate-600 hover:text-brand-gold transition-colors">Party Trackers</a></li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

