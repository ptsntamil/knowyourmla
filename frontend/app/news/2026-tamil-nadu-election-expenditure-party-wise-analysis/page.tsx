import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import ArticleHeader from '@/components/news/ArticleHeader';
import SocialShare from '@/components/news/SocialShare';
import { ChevronRight, FileText, BarChart2, ShieldAlert, CheckCircle2 } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Tamil Nadu Election 2026: How Political Parties Reported Their Election Expenditure';
  const description = 'An in-depth analysis of how political parties reported their election expenditure for the 2026 Tamil Nadu Assembly Election.';
  const slug = '2026-tamil-nadu-election-expenditure-party-wise-analysis';

  return {
    title,
    description,
    keywords: ['Tamil Nadu Election Expenditure', 'TN Election Spending', 'Party Expenditure 2026', 'TN Political Finance'],
    alternates: {
      canonical: `https://knowyourmla.info/news/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://knowyourmla.info/news/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ExpenditureAnalysisArticle() {
  const title = 'Tamil Nadu Election 2026: How Political Parties Reported Their Election Expenditure';
  const articleUrl = '/news/2026-tamil-nadu-election-expenditure-party-wise-analysis';
  const publishDate = "October 10, 2026";
  const readingTime = "6 min";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "datePublished": "2026-10-10T00:00:00+05:30",
    "dateModified": "2026-10-10T00:00:00+05:30",
    "author": [{
      "@type": "Organization",
      "name": "KnowYourMLA Data Team",
      "url": "https://knowyourmla.info"
    }]
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleHeader
        title={title}
        publishDate={publishDate}
        readingTime={readingTime}
        shareUrl={`${process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla.info"}${articleUrl}`}
      />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="space-y-16">

          <section className="space-y-6 text-slate-700 dark:text-slate-300 text-lg leading-relaxed max-w-none">

            <p className="text-xl leading-relaxed text-slate-600 font-medium">
              Following the 2026 Tamil Nadu Assembly Elections, political parties have submitted their
              election expenditure information. This data provides a window into the financial mechanics of modern campaigning.
            </p>

            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              To explore the detailed breakdown of reported spending, visit our comprehensive <Link href="/tn/analysis/2026-election-expenditure" className="text-brand-gold font-bold hover:underline">2026 Election Expenditure Transparency</Link> dashboard.
            </p>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white flex items-center gap-2 mt-10">
              <FileText className="w-6 h-6 text-brand-gold" />
              Why Election Expenditure Matters
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Transparency in political financing is a cornerstone of a healthy democracy. Expenditure reports
              allow voters to understand the scale of financial resources deployed during an election and
              categorize where those resources were focused—whether on mass media advertising, direct candidate
              funding, or physical rallies.
            </p>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white flex items-center gap-2 mt-10">
              <CheckCircle2 className="w-6 h-6 text-brand-gold" />
              How Election Expenditure Is Reported
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Political parties file their expenditure reports in specific formats, often broadly categorizing
              spending into &quot;General Propaganda&quot; (party-wide campaigning) and &quot;Candidate Expenditure&quot;
              (funds allocated specifically to individual candidates).
            </p>

            <div className="bg-brand-gold/10 dark:bg-brand-gold/5 border border-brand-gold/30 dark:border-brand-gold/20 rounded-2xl p-6 mt-8 mb-8 text-brand-dark dark:text-white">
              <div className="flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-brand-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-black mt-0 mb-2 text-brand-dark dark:text-white">Important Note on Reporting Scope</h3>
                  <p className="m-0 leading-relaxed text-slate-700 dark:text-slate-300">
                    Not all reports are strictly for Tamil Nadu. Some national and regional
                    parties file multi-state reports (e.g., combining Tamil Nadu, Puducherry, and Kerala).
                    This makes direct party-to-party comparison methodologically complex.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white mt-10">Where Did Political Parties Report Spending Their Money?</h2>

            <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-black text-brand-dark dark:text-white mb-3">Media & Digital Advertising</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  A significant portion of general propaganda expenditure for major parties goes toward media and
                  digital advertising. This includes television spots, print media, social media campaigns, and bulk messaging.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-black text-brand-dark dark:text-white mb-3">Candidate Funding</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Parties also provide lump-sum payments to their candidates. This forms the bulk of what is reported
                  under candidate expenditure.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:col-span-2">
                <h3 className="text-lg font-black text-brand-dark dark:text-white mb-3">Campaign Materials & Rallies</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Physical campaign intensity—measured through spending on posters, banners, flags, and public
                  processions—remains a core component of Tamil Nadu electioneering.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white flex items-center gap-2 mt-10">
              <BarChart2 className="w-6 h-6 text-brand-gold" />
              Party-Wise Election Expenditure
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              You can view the detailed breakdown for major parties here:
            </p>
            <ul className="grid sm:grid-cols-2 gap-4 not-prose my-6">
              <li>
                <Link href="/tn/election-expenditure/2026/dmk" className="block p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:border-brand-gold hover:shadow-md transition-all text-brand-dark dark:text-white font-bold text-center">
                  DMK Expenditure
                </Link>
              </li>
              <li>
                <Link href="/tn/election-expenditure/2026/aiadmk" className="block p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:border-brand-gold hover:shadow-md transition-all text-brand-dark dark:text-white font-bold text-center">
                  AIADMK Expenditure
                </Link>
              </li>
              <li>
                <Link href="/tn/election-expenditure/2026/bjp" className="block p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:border-brand-gold hover:shadow-md transition-all text-brand-dark dark:text-white font-bold text-center">
                  BJP Expenditure
                </Link>
              </li>
              <li>
                <Link href="/tn/election-expenditure/2026/ntk" className="block p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:border-brand-gold hover:shadow-md transition-all text-brand-dark dark:text-white font-bold text-center">
                  NTK Expenditure
                </Link>
              </li>
              <li className="sm:col-span-2">
                <Link href="/tn/election-expenditure/2026/tvk" className="block p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:border-brand-gold hover:shadow-md transition-all text-brand-dark dark:text-white font-bold text-center">
                  TVK Expenditure
                </Link>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white mt-12">Where Did Parties Spend the Most?</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              An analysis of the reported data shows that expenditure priorities differ based on a party&apos;s organizational structure. For most major parties, <strong className="text-slate-900 dark:text-white">Media & Digital Advertising</strong> represents the largest single category of General Propaganda.
            </p>
            <ul className="list-none space-y-3 pl-0 mb-6 mt-6 not-prose">
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">AIADMK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Reported <strong className="text-slate-900 dark:text-white">₹103.98 Crore</strong> on Media Advertising and <strong className="text-slate-900 dark:text-white">₹4.11 Crore</strong> on Publicity Materials (Scope: TN + Puducherry + Kerala).</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">DMK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Allocated <strong className="text-slate-900 dark:text-white">₹70.63 Crore</strong> for Media Advertising and <strong className="text-slate-900 dark:text-white">₹2.03 Crore</strong> for Publicity Materials (Scope: TN + Puducherry).</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">TVK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Dedicated <strong className="text-slate-900 dark:text-white">₹6.34 Crore</strong> to Media & Digital Advertising, alongside <strong className="text-slate-900 dark:text-white">₹1.42 Crore</strong> for Campaign Materials and <strong className="text-slate-900 dark:text-white">₹34 Lakh</strong> for Virtual Campaigns.</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">NTK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Relied more heavily on grassroots visibility, spending <strong className="text-slate-900 dark:text-white">₹11.15 Lakh</strong> on Media Advertising, <strong className="text-slate-900 dark:text-white">₹6.76 Lakh</strong> on materials, and <strong className="text-slate-900 dark:text-white">₹17.56 Lakh</strong> on Public Meetings.</div>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white mt-12">Star Campaigners vs. Regular Travel</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The Election Commission of India (ECI) guidelines allow political parties to nominate a specific number of &quot;Star Campaigners&quot; whose travel expenses are borne by the party&apos;s central unit. According to the available reports, spending on Star Campaigner travel (often involving chartered flights and helicopters) accounts for a major portion of logistical expenditure.
            </p>
            <ul className="list-none space-y-3 pl-0 mb-6 mt-6 not-prose">
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">DMK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Disclosed <strong className="text-slate-900 dark:text-white">₹5.91 Crore</strong> for Star Campaigner travel, contrasting with <strong className="text-slate-900 dark:text-white">₹8 Lakh</strong> for other leaders.</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">TVK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Reported <strong className="text-slate-900 dark:text-white">₹3.54 Crore</strong> for Star Campaigner travel and <strong className="text-slate-900 dark:text-white">₹48 Lakh</strong> for other leader travel.</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">AIADMK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Filed <strong className="text-slate-900 dark:text-white">₹17.37 Lakh</strong> for Star Campaigner travel and <strong className="text-slate-900 dark:text-white">₹1.75 Lakh</strong> for other leaders across their multi-state report.</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">NTK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Flipped the trend, reporting more on general cadres (<strong className="text-slate-900 dark:text-white">₹15.13 Lakh</strong>) compared to Star Campaigners (<strong className="text-slate-900 dark:text-white">₹2.30 Lakh</strong>).</div>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white mt-12">Candidate Funding Patterns</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              While parties incur massive costs centrally through General Propaganda, they also distribute lump-sum amounts directly to their contesting candidates.
            </p>
            <ul className="list-none space-y-3 pl-0 mb-6 mt-6 not-prose">
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">DMK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Recorded the highest direct funding category, reporting <strong className="text-slate-900 dark:text-white">₹45.75 Crore</strong> in lump-sum payments to candidates (TN + Puducherry).</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">TVK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Reported a base <strong className="text-slate-900 dark:text-white">₹1.85 Crore</strong> for direct candidate funding, plus candidate-specific media and rally spending totaling over <strong className="text-slate-900 dark:text-white">₹1.45 Crore</strong>.</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">NTK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Distributed a total of <strong className="text-slate-900 dark:text-white">₹44.25 Lakh</strong> in lump-sum payments across their candidates.</div>
              </li>
              <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded shadow-sm text-xs font-black uppercase text-brand-dark dark:text-white min-w-24 text-center mt-0.5">AIADMK</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Did not disclose a centralized lump-sum candidate payment category in this dataset, though they reported <strong className="text-slate-900 dark:text-white">₹2.78 Crore</strong> specifically for the publication of candidate criminal antecedents.</div>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white mt-12">Understanding Data Quality and Reconciliation</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our <Link href="/tn/analysis/2026-election-expenditure" className="font-bold text-brand-dark dark:text-brand-light-gold hover:text-brand-gold dark:hover:text-white underline decoration-slate-200 dark:decoration-slate-700 underline-offset-4">transparency dashboard</Link> highlights several data quality issues found in the
              available sources. In some cases, the sum of the reported categories does not perfectly match
              the reported grand total. KnowYourMLA preserves these original figures without silently
              reconciling them, ensuring voter visibility into the quality of the disclosures.
            </p>

            <h2 className="text-2xl font-black text-brand-dark dark:text-white mt-10">Methodology</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              This analysis extracts category-level expenditure from available sources. Where parties have
              filed multi-state reports, the full scope is noted. Calculated totals are provided alongside
              reported totals to verify data integrity. For a full methodology, please refer to the main
              transparency dashboard.
            </p>
          </section>

          <section className="bg-brand-gold/5 dark:bg-slate-900/60 rounded-[40px] p-8 md:p-12 border border-brand-gold/10 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-[0]">
            <div className="space-y-4">
              <Link href="/tn/analysis/2026-election-expenditure" className="block text-sm font-black text-brand-dark dark:text-white hover:text-brand-gold transition-colors uppercase tracking-widest py-2 border-b-2 border-brand-gold w-fit cursor-pointer relative z-[9999] pointer-events-auto">
                Explore The Data
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed italic">
                Curious about where election money was spent? Check out our complete, <Link href="/tn/analysis/2026-election-expenditure" className="font-bold text-brand-gold hover:text-brand-dark dark:hover:text-white transition-colors underline underline-offset-2">interactive dashboard</Link> showing party-wise expenditure categories.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end gap-4">
              <SocialShare url={`${process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla.info"}${articleUrl}`} title={title} />
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-8 pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <h3 className="text-2xl font-black text-brand-dark dark:text-white uppercase tracking-tight mb-6 text-center">Want to view the dashboard?</h3>
            <Link
              href="/tn/analysis/2026-election-expenditure"
              className="group bg-brand-dark dark:bg-slate-900 border border-transparent dark:border-slate-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 hover:bg-black dark:hover:bg-slate-800 transition-all shadow-xl hover:shadow-brand-gold/20 text-center"
            >
              View Election Expenditure Dashboard
              <ChevronRight className="group-hover:translate-x-2 transition-transform text-brand-gold flex-shrink-0" />
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}
