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
import { AVAILABLE_ELECTION_YEARS } from '@/lib/constants/elections';
import FAQSection from '@/components/seo/FAQSection';

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;

  return buildMetadata({
    title: `Tamil Nadu Election ${year} Insights: Party Performance & Deposit Lost Analysis | KnowYourMLA`,
    description: `Detailed party-wise performance metrics for the Tamil Nadu Assembly Election ${year}. Analyze district footprints, 2nd & 3rd place finishes, and security deposits lost/saved by all contesting parties.`,
    path: `/tn/elections/${year}/insights`,
    image: `/tn/elections/${year}/opengraph-image?type=closest`,
    keywords: [
      `Tamil Nadu Election ${year} Insights`,
      `TN Election ${year} Analysis`,
      `party performance analysis`,
      `district footprint by party`,
      `second place finishes by party`,
      `third place finishes by party`,
      `deposit lost candidates`,
      `party deposit lost seats`,
      `deposit lost analysis Tamil Nadu election`
    ]
  });
}

export async function generateStaticParams() {
  return AVAILABLE_ELECTION_YEARS.map(year => ({ year }));
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

  const faqs = [
    {
      question: `What is the 'District Footprint' of a party in the ${year} Tamil Nadu election?`,
      answer: `The district footprint represents the total number of unique districts in Tamil Nadu where a political party won at least one constituency in the ${year} assembly election. It serves as a measure of a party's geographic reach and spread across the state.`
    },
    {
      question: `Which parties secured the most runner-up (2nd place) and 3rd place finishes in ${year}?`,
      answer: `The Party Performance Analysis section above documents the exact number of 2nd place (runner-up) and 3rd place finishes for all contesting parties (including DMK, AIADMK, TVK, etc.) in the ${year} Tamil Nadu assembly election.`
    },
    {
      question: "What does \"deposit lost\" mean in elections?",
      answer: `A candidate is said to have lost their security deposit when they fail to secure a minimum of one-sixth (16.67%) of the total valid votes polled in their respective constituency during an election.`
    },
    {
      question: `Which party lost the most deposits in the Tamil Nadu ${year} assembly election?`,
      answer: `The party-wise deposit loss breakdown is shown in the Deposit Lost Analysis table above. It documents the total contested seats, deposit lost count, saved count, and loss percentage for every registered political party in the ${year} Tamil Nadu elections.`
    },
    {
      question: `Which candidates lost their deposits in the ${year} elections?`,
      answer: `View constituency-wise and party-wise lists of candidates who lost deposits by filtering candidates by election year in our individual constituency and party profile directory.`
    },
    {
      question: "How is the deposit loss percentage calculated?",
      answer: "Deposit loss percentage is computed by dividing the number of candidates who lost their security deposits by the total number of contested seats for a party, and multiplying the result by 100."
    },
    {
      question: "Why is deposit lost analysis important in Tamil Nadu politics?",
      answer: "Deposit lost analysis serves as an excellent health indicator for political parties. It shows which parties have strong core bases versus those contesting in name only without real grassroots support."
    }
  ];

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

        {/* FAQ Section */}
        <section className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
