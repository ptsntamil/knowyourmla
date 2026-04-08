import { fetchPartyDetails } from "@/services/api";
import PartyHero from "@/components/PartyHero";
import PartyAnalyticsTabs from "@/components/PartyAnalyticsTabs";
import PartyElectionView from "@/components/PartyElectionView";
import PartyTimelineCharts from "@/components/PartyTimelineCharts";
import SectionNav from "@/components/SectionNav";
import PartySummaryStats from "@/components/PartySummaryStats";
import PartyKeyInsights from "@/components/PartyKeyInsights";
import ElectionFilter from "@/components/ElectionFilter";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import SEOIntro from "@/components/seo/SEOIntro";
import AnswerSnippet from "@/components/seo/AnswerSnippet";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import VoteShareByElectionSection from "@/components/party/VoteShareByElectionSection";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ election?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const data = await fetchPartyDetails(slug).catch(() => ({ party: null }));
    const partyName = data.party?.name || slug.toUpperCase();
    const shortName = data.party?.short_name || partyName;

    return buildMetadata({
      title: `${partyName} (${shortName}) in Tamil Nadu: MLAs, Vote Share, Election Performance`,
      description: `Explore ${partyName} (${shortName}) performance in Tamil Nadu including current MLAs, vote share across assembly elections, seats won, election trends, and political insights on KnowYourMLA.`,
      path: `/parties/${slug}`,
      keywords: [`${partyName} Party`, "Tamil Nadu Politics", "Election Analytics", "Vote Share Trends", "MLA Candidates", "Political Party Analysis"]
    });
  } catch (error) {
    return buildMetadata({
      title: "Political Party Profile",
      description: "View political party MLA list and election performance analytics.",
      path: `/parties/${slug}`
    });
  }
}

export default async function PartyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { election } = await searchParams;

  let partyData: any = { party: null, analytics: null, availableElections: [] };

  try {
    partyData = await fetchPartyDetails(slug, election);
  } catch (error) {
    console.error("Failed to fetch party details:", error);
  }

  const { party, analytics, availableElections } = partyData;

  if (!party) {
    return (
      <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Party Not Found</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">The requested party slug "{slug}" does not exist in our records.</p>
        </div>
        <Link href="/tn" className="px-8 py-3 bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
          Back to Home
        </Link>
      </div>
    );
  }

  const isAllElections = !election || election === "all";
  const selectedYear = isAllElections ? null : parseInt(election);

  const faqs = [
    {
      question: `How many MLAs does ${party.short_name} have in Tamil Nadu?`,
      answer: `${party.name} (${party.short_name}) currently has several representatives in the Tamil Nadu Assembly. You can view the full list of constituencies they represent on this page.`
    },
    {
      question: `Which constituencies are represented by ${party.short_name}?`,
      answer: `Consituencies such as those listed in the Candidate Roster section above are represented by ${party.short_name} candidates and MLAs.`
    },
    {
      question: `Where can I view the current ${party.short_name} MLA list?`,
      answer: `The complete and current list of ${party.short_name} MLAs, along with their photos, assets, and election history, is available here on KnowYourMLA.`
    },
    {
      question: `What was ${party.short_name}'s vote share in the latest Tamil Nadu Assembly election?`,
      answer: `${party.name} received a vote share of ${analytics?.vote_share?.latest?.vote_share_percent || 'significant percentage'}% in the most recent election it contested. Detailed year-by-year vote share data is available in the "Vote Share Across Elections" section.`
    },
    {
      question: `How has ${party.short_name}'s voter support changed over time?`,
      answer: `Voter support for ${party.short_name}, measured by total votes and vote share percentage, has evolved across different assembly cycles. You can track these trends through our interactive charts documenting their performance since 2011.`
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg selection:bg-brand-gold/20">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          commonBreadcrumbs.parties,
          { name: party.name, item: `/parties/${slug}` }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <nav className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link href="/tn" className="hover:text-brand-dark transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/parties" className="hover:text-brand-dark transition-colors">Parties</Link>
          <span className="text-slate-300">/</span>
          <span className="text-brand-gold">{party.short_name || party.name}</span>
        </nav>
      </div>

      <PartyHero party={party} analytics={analytics} />

      <ElectionFilter options={availableElections || []} />

      <SectionNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 mt-8 sm:mt-12">
        <div className="space-y-12 mb-16">
          <SEOIntro
            h1={`${party.short_name} Election Performance and Vote Share in Tamil Nadu`}
            intro={`This page provides a comprehensive overview of ${party.name} (${party.short_name || party.name}) in Tamil Nadu. Explore their election performance through seats won and vote share trends across assembly elections, along with detailed candidate analytics and financial profiles.`}
          />

          <AnswerSnippet
            question={`What is the election performance of ${party.short_name} in Tamil Nadu?`}
            answer={`${party.name} has contested multiple assembly elections in Tamil Nadu. The party's voter support is reflected in its vote share percentage and total votes received across various election cycles, as detailed in the analytics below.`}
          />
        </div>

        <div className="space-y-20 sm:space-y-32">
          <section id="overview" className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-5xl font-black text-brand-dark dark:text-slate-800 uppercase tracking-tighter">Performance Overview</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                {isAllElections ? "Historical statistics across all elections" : `Aggregated metrics for the ${election} cycle`}
              </p>
            </div>
            <PartySummaryStats
              stats={{
                ...analytics?.stats,
                totalElections: analytics?.stats?.totalElections || availableElections?.length || 0
              }}
              isYearView={!isAllElections}
            />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 p-10 bg-brand-dark rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-brand-dark/20 mt-12">
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Electoral Context</h3>
                <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
                  How did {party.short_name} perform relative to the state-level benchmarks? 
                  Explore the full {election && election !== 'all' ? election : '2021'} assembly insights to see winning margins, vote share distributions, and analytical breakdowns.
                </p>
              </div>
              <Link 
                href={`/tn/elections/${election && election !== 'all' ? election : '2021'}/insights`}
                className="bg-brand-gold text-brand-dark font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:scale-105 transition-all relative z-10 shadow-xl shadow-black/20 shrink-0"
              >
                Explore {election && election !== 'all' ? election : '2021'} Analysis
              </Link>
            </div>
          </section>

          <section id="insights">
            <PartyKeyInsights analytics={analytics} />
          </section>

          <section id="trends" className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-5xl font-black text-brand-dark dark:text-slate-900 uppercase tracking-tighter">
                {isAllElections ? "Historical Trends" : `${election} Distributions`}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                {isAllElections ? "Evolution of party performance" : `Demographic breakdown for this selection`}
              </p>
            </div>
            {analytics?.timeline && analytics.timeline.length > 0 ? (
              <PartyTimelineCharts analytics={analytics} isYearView={!isAllElections} selectedYear={selectedYear} />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Data visualization not available</p>
              </div>
            )}
          </section>
          
          <VoteShareByElectionSection voteShare={party.vote_share} selectedYear={selectedYear} />

          <section id="analytics">
            <PartyAnalyticsTabs analytics={analytics} isYearView={!isAllElections} />
          </section>

          <section id="candidates">
            <PartyElectionView
              partySlug={slug}
              initialYear={isAllElections ? undefined : selectedYear!}
              years={analytics?.elections || []}
              isGlobalFilter={true}
            />
          </section>

          <div className="grid lg:grid-cols-2 gap-12 pt-12 border-t border-slate-100 dark:border-slate-800">
            {analytics?.education?.graduateCount !== undefined && analytics.education.graduateCount > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-brand-dark dark:text-slate-900 uppercase tracking-tight">Education Profile</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  In terms of educational qualifications, {party.short_name} has fielded a total of {analytics.education.graduateCount} graduates and post-graduates.
                  The most prevalent education level observed is "{analytics.education.mostCommon}".
                </p>
              </div>
            )}
            {analytics?.assets?.median !== undefined && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-brand-dark dark:text-slate-900 uppercase tracking-tight">Financial Profile</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  The median asset declaration is {analytics.assets.median.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}.
                  Approximately {analytics.assets.crorepatiPercentage}% of the candidates are crorepatis.
                </p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-18 pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
