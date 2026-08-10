import React from 'react';
import Link from 'next/link';
import ArticleHeader from '@/components/news/ArticleHeader';
import SocialShare from '@/components/news/SocialShare';
import { ArrowRight, Info, CheckCircle2, AlertTriangle, FileText, BarChart3, Database } from 'lucide-react';

export const dynamic = 'force-static';

// SEO Metadata
export async function generateMetadata() {
  const title = "Did the Vijay Factor Increase Voter Turnout? | Tamil Nadu Election Data Analysis | KnowYourMLA";
  const description = "Did Vijay's political debut increase voter participation in Tamil Nadu? Explore constituency-wise votes polled, urban-rural voting trends, TVK vote share analysis and official election statistics in this evidence-based investigation.";
  const url = "/news/did-vijay-factor-increase-voter-turnout";

  return {
    title,
    description,
    keywords: ['Vijay factor', 'Vijay voter turnout', 'TVK election analysis', 'TVK vote share', 'Tamil Nadu voter turnout', 'Constituency-wise votes polled', 'Urban rural voting', 'Election statistics', 'Political data analysis', 'TVK voting trends', 'Tamil Nadu Assembly Election'],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'Did the Vijay Factor Increase Voter Turnout?',
        },
      ],
    },
  };
}

export default function VijayTurnoutAnalysisPage() {
  const description = "Did Vijay's political debut increase voter participation in Tamil Nadu? Explore constituency-wise votes polled, urban-rural voting trends, TVK vote share analysis and official election statistics in this evidence-based investigation.";
  const publishDate = "August 10, 2026";
  const readingTime = "5 min";
  const articleUrl = "/news/did-vijay-factor-increase-voter-turnout";
  const title = "Did the Vijay Factor Increase Voter Turnout? A Data-Driven Investigation";
  
  // JSON-LD Structured Data
  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "datePublished": "2026-08-10T00:00:00+05:30",
    "dateModified": "2026-08-10T00:00:00+05:30",
    "author": {
      "@type": "Organization",
      "name": "KnowYourMLA Team",
      "url": "https://knowyourmla.in"
    },
    "publisher": {
      "@type": "Organization",
      "name": "KnowYourMLA",
      "logo": {
        "@type": "ImageObject",
        "url": "https://knowyourmla.in/KnowYourMLA_logo.png"
      }
    },
    "description": description,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://knowyourmla.in${articleUrl}`
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Did more people vote in the 2026 Tamil Nadu Election?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Tamil Nadu recorded its highest-ever voter participation, with over 4.87 crore votes polled, despite a significant reduction in the total registered electorate."
        }
      },
      {
        "@type": "Question",
        "name": "Did the Vijay factor (TVK) increase voter turnout?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The available election data indicates that the timing of TVK's emergence coincided with record voter participation. Constituencies with higher TVK vote share frequently experienced larger increases in voter participation. While these findings do not establish causation, they are consistent with the possibility that TVK's emergence helped mobilize previously disengaged voters."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-gold/20 scroll-smooth">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero Section */}
      <ArticleHeader
        title={title}
        publishDate={publishDate}
        readingTime={readingTime}
      />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col gap-12">
            
          {/* Subtitle / Intro */}
          <section className="prose prose-slate max-w-none">
            <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8">
              Tamil Nadu recorded its highest-ever voter participation during the 2026 Assembly Election. <strong>Did Vijay's political debut contribute to that increase?</strong> We analysed constituency-level election data, votes polled, urban-rural voting trends and TVK vote share to investigate what the available evidence actually shows.
            </p>
          </section>

          {/* Executive Summary */}
          <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-2xl font-black text-brand-dark flex items-center gap-3 mb-6 uppercase tracking-tighter">
              <FileText className="text-brand-gold" /> Executive Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Constituencies Analysed</div>
                <div className="text-2xl font-black text-brand-dark">234</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elections Compared</div>
                <div className="text-2xl font-black text-brand-dark">2021 & 2026</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reports Used</div>
                <div className="text-2xl font-black text-brand-dark">3</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Votes Analysed</div>
                <div className="text-2xl font-black text-brand-dark">9.5+ Crore</div>
              </div>
            </div>

            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Key Findings</h4>
            <ul className="space-y-3 text-slate-600 font-medium">
              <li className="flex gap-3"><CheckCircle2 className="text-brand-green shrink-0" size={20} /> Tamil Nadu recorded record votes cast.</li>
              <li className="flex gap-3"><CheckCircle2 className="text-brand-green shrink-0" size={20} /> Actual votes increased despite the electoral roll shrinking.</li>
              <li className="flex gap-3"><CheckCircle2 className="text-brand-green shrink-0" size={20} /> Urban constituencies generally added more votes than rural constituencies.</li>
              <li className="flex gap-3"><CheckCircle2 className="text-brand-green shrink-0" size={20} /> Constituencies with higher TVK vote share frequently recorded greater vote growth.</li>
              <li className="flex gap-3"><AlertTriangle className="text-amber-500 shrink-0" size={20} /> The available evidence suggests a possible relationship but does not establish causation.</li>
            </ul>
          </section>

          {/* Research Question */}
          <section className="bg-brand-dark text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mb-4">Research Question</h2>
             <p className="text-2xl md:text-3xl font-black leading-tight mb-8">
               Did the emergence of Tamilaga Vettri Kazhagam (TVK) contribute to higher voter participation in the 2026 Tamil Nadu Assembly Election?
             </p>
             <div className="bg-white/10 p-6 rounded-2xl border border-white/10 text-slate-300 font-medium text-sm leading-relaxed">
               <p className="mb-2"><strong className="text-white">Explain:</strong> This investigation evaluates whether constituency-level election statistics are consistent with that hypothesis. It does not attempt to prove political intent.</p>
             </div>
          </section>

          {/* Why This Question Matters */}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Why This Question Matters</h2>
            <p><Link href="/tn/analysis/voters-trend" className="text-brand-dark hover:text-brand-gold underline decoration-brand-gold/30 decoration-2 underline-offset-2 font-bold">Tamil Nadu recorded its highest voter participation in history.</Link> Simultaneously, TVK entered politics for the first time and rapidly became one of the state's largest political parties. Many commentators linked these two events.</p>
            <p className="font-bold border-l-4 border-brand-gold pl-4 text-brand-dark">Rather than relying on opinion, this article analyses election statistics to evaluate the claim.</p>
            
            <h3 className="mt-8 text-xl font-bold">How We Conducted This Investigation</h3>
            <p>The investigation consists of four independent questions:</p>
            <ol className="font-medium">
              <li><strong>Did Tamil Nadu actually record more votes?</strong> (Source: <Link href="/tn/analysis/voters-trend">Voters Trend</Link>)</li>
              <li><strong>Were additional votes concentrated in Urban constituencies?</strong> (Source: <Link href="/tn/analysis/urban-rural-2026-comparison">Urban vs Rural Analysis</Link>)</li>
              <li><strong>Did constituencies with stronger TVK support also record larger increases in votes?</strong> (Source: <Link href="/tn/analysis/tvk-vote-share-turnout-constituency-level">TVK Vote Share Analysis</Link>)</li>
              <li><strong>Did voter participation exceed what would normally be expected from natural voter growth?</strong></li>
            </ol>
          </section>

          {/* Methodology & Formula */}
          <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Database className="text-brand-gold" /> Methodology & Formulas
            </h2>
            <p className="text-slate-600 mb-6 font-medium">
              This analysis uses <strong>Votes Polled</strong> as the primary comparison metric. Turnout percentage alone may be misleading because the total electoral roll was significantly reduced after the Special Intensive Revision (SIR), which artificially inflates turnout percentages.
            </p>

            <div className="grid gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Formula 1</div>
                <h4 className="text-lg font-bold text-brand-dark mb-3">Votes Added</h4>
                <code className="block bg-slate-50 p-4 rounded-xl text-brand-dark font-mono text-sm border border-slate-100">
                  Votes Added = Votes Polled (2026) - Votes Polled (2021)
                </code>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Formula 2</div>
                <h4 className="text-lg font-bold text-brand-dark mb-3">Vote Growth %</h4>
                <code className="block bg-slate-50 p-4 rounded-xl text-brand-dark font-mono text-sm border border-slate-100 mb-4 overflow-x-auto whitespace-nowrap">
                  Vote Growth % = ((Votes Polled 2026 - Votes Polled 2021) / Votes Polled 2021) × 100
                </code>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-100 font-bold text-brand-dark">
                      <tr><th className="px-4 py-2">2021</th><th className="px-4 py-2">2026</th><th className="px-4 py-2">Votes Added</th><th className="px-4 py-2">Growth</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="px-4 py-2 border-t">100</td><td className="px-4 py-2 border-t">110</td><td className="px-4 py-2 border-t">10</td><td className="px-4 py-2 border-t">10%</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Formula 3</div>
                <h4 className="text-lg font-bold text-brand-dark mb-3">Turnout Percentage</h4>
                <code className="block bg-slate-50 p-4 rounded-xl text-brand-dark font-mono text-sm border border-slate-100 mb-2">
                  Turnout % = (Votes Polled / Registered Electorate) × 100
                </code>
                <p className="text-xs text-slate-500 italic">Turnout percentage is presented only as supporting information because the electoral roll changed after SIR.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Deep Analysis: The 3.62 Lakh Additional Voters</div>
                <h4 className="text-lg font-bold text-brand-dark mb-3">Calculating the "Vijay Factor" Residual Impact</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 font-mono text-sm space-y-2 text-slate-700">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span>Votes Polled (2021)</span>
                    <span className="font-bold">4,58,86,784</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 py-2">
                    <span>First-time voters (2024 cohort)</span>
                    <span className="font-bold">+ 10,90,547</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 py-2">
                    <span>First-time voters (2026 cohort)</span>
                    <span className="font-bold">+ 14,59,000</span>
                  </div>
                  <div className="flex justify-between py-2 text-brand-dark font-black">
                    <span>Expected Votes (Baseline for 2026)</span>
                    <span>= 4,84,36,331</span>
                  </div>
                </div>
                <div className="bg-brand-dark text-brand-gold p-4 rounded-xl font-mono text-sm space-y-2 shadow-inner">
                  <div className="flex justify-between border-b border-brand-gold/20 pb-2">
                    <span>Actual Votes Polled (2026)</span>
                    <span className="font-bold">4,87,98,833</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-gold/20 py-2">
                    <span>Expected Votes (Baseline)</span>
                    <span className="font-bold">- 4,84,36,331</span>
                  </div>
                  <div className="flex justify-between py-2 font-black text-white text-base">
                    <span>Additional / Residual Voters</span>
                    <span>= 3,62,502</span>
                  </div>
                </div>
                <div className="bg-brand-dark/5 p-4 rounded-xl text-sm font-medium text-brand-dark mt-4 border-l-4 border-brand-gold">
                  <strong>Analysis:</strong> Around 3.62 lakh additional voters cast their ballots in 2026, <em>excluding</em> the natural growth of new youth voters. Did Vijay make an impact mobilizing these 3.62 lakh voters? The data below investigates this.
                </div>
              </div>
            </div>
          </section>

          {/* Section 1 */}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter border-b-2 border-brand-gold pb-2 inline-block">1. Tamil Nadu Recorded Record Votes</h2>
            <p><Link href="/tn/analysis/voters-trend" className="text-brand-dark hover:text-brand-gold underline decoration-brand-gold/30 decoration-2 underline-offset-2">The total number of votes polled in Tamil Nadu reached an all-time high in 2026.</Link> Comparing the official totals to previous cycles reveals significant growth in absolute participation.</p>
            
            <div className="not-prose overflow-x-auto rounded-2xl border border-slate-200 mt-6 shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 font-black text-brand-dark uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Election</th>
                    <th className="px-6 py-4">Electorate</th>
                    <th className="px-6 py-4">Votes Polled</th>
                    <th className="px-6 py-4">First-Time Voters (18-19)</th>
                    <th className="px-6 py-4">Turnout</th>
                    <th className="px-6 py-4 text-brand-green">Votes Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-brand-dark font-bold">2016 Assembly</td>
                    <td className="px-6 py-4">5.78 Crore</td>
                    <td className="px-6 py-4">4,32,34,665</td>
                    <td className="px-6 py-4">6,00,000</td>
                    <td className="px-6 py-4">74.81%</td>
                    <td className="px-6 py-4 text-slate-400">Baseline</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-brand-dark font-bold">2019 Lok Sabha</td>
                    <td className="px-6 py-4">5.98 Crore</td>
                    <td className="px-6 py-4">4,33,89,353</td>
                    <td className="px-6 py-4">9,00,000</td>
                    <td className="px-6 py-4">72.44%</td>
                    <td className="px-6 py-4 text-slate-400">N/A</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-brand-dark font-bold">2021 Assembly</td>
                    <td className="px-6 py-4">6.29 Crore</td>
                    <td className="px-6 py-4">4,58,86,784</td>
                    <td className="px-6 py-4">13,09,311</td>
                    <td className="px-6 py-4">73.63%</td>
                    <td className="px-6 py-4 text-brand-green">+26 Lakhs (vs 2016)</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-brand-dark font-bold">2024 Lok Sabha</td>
                    <td className="px-6 py-4">6.23 Crore</td>
                    <td className="px-6 py-4">4,37,00,000</td>
                    <td className="px-6 py-4">10,90,547</td>
                    <td className="px-6 py-4">70.14%</td>
                    <td className="px-6 py-4 text-red-500">-21 Lakhs (vs 2021)</td>
                  </tr>
                  <tr className="bg-brand-gold/5 hover:bg-brand-gold/10">
                    <td className="px-6 py-4 text-brand-dark font-black">2026 Assembly</td>
                    <td className="px-6 py-4">5.73 Crore</td>
                    <td className="px-6 py-4 font-black">4,87,98,833</td>
                    <td className="px-6 py-4 font-bold">14,59,000</td>
                    <td className="px-6 py-4 font-black">85.15%</td>
                    <td className="px-6 py-4 text-brand-green font-black">+29 Lakhs (vs 2021)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 */}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter border-b-2 border-brand-gold pb-2 inline-block">2. Which Constituencies Added the Most Votes?</h2>
            <p>We mapped the total votes added across all 234 constituencies. <Link href="/tn/election-analysis/constituency-wise-votes-polled-2021-vs-2026">View the full constituency-wise data here</Link>.</p>
            <p className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-200"><em>Data Observation:</em> The constituencies recording the highest nominal increases in votes cast were overwhelmingly located in districts spanning Chennai, Chengalpattu, and Tiruvallur.</p>
          </section>

          {/* Section 3 */}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter border-b-2 border-brand-gold pb-2 inline-block">3. Were Cities Driving the Increase?</h2>
            <p>To determine where the growth originated, we categorized constituencies based on the Election Commission's demographic delineations (Urban, Semi-Urban, Rural).</p>
            
            <div className="not-prose overflow-x-auto rounded-2xl border border-slate-200 mt-6 shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 font-black text-brand-dark uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Constituencies</th>
                    <th className="px-6 py-4 text-brand-green">Avg Vote Growth %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr className="bg-brand-gold/5">
                    <td className="px-6 py-4 text-brand-dark font-black">Urban</td>
                    <td className="px-6 py-4">84</td>
                    <td className="px-6 py-4 text-brand-green font-black">Higher Average Growth</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-brand-dark font-bold">Semi Urban</td>
                    <td className="px-6 py-4">43</td>
                    <td className="px-6 py-4 font-bold">Moderate Growth</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-brand-dark font-bold">Rural</td>
                    <td className="px-6 py-4">107</td>
                    <td className="px-6 py-4">Baseline Growth</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-slate-500 italic">Explore the interactive <Link href="/tn/analysis/urban-rural-2026-comparison">Urban vs Rural Analysis</Link> for detailed constituency breakdowns.</p>
          </section>

          {/* Section 4 */}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter border-b-2 border-brand-gold pb-2 inline-block">4. Did Higher TVK Vote Share Coincide With Greater Vote Growth?</h2>
            <p>We ran a Pearson correlation analysis plotting the Vote Growth % against TVK's Vote Share in all 234 constituencies. <Link href="/tn/analysis/tvk-vote-share-turnout-constituency-level">View the scatter plot analysis</Link>.</p>
            
            <div className="not-prose overflow-x-auto rounded-2xl border border-slate-200 mt-6 shadow-sm">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 font-black text-brand-dark uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">TVK Vote Share Range</th>
                    <th className="px-6 py-4">Avg Votes Added</th>
                    <th className="px-6 py-4">Avg Growth %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr><td className="px-6 py-4 font-bold">0–10%</td><td className="px-6 py-4">Lowest</td><td className="px-6 py-4">Baseline</td></tr>
                  <tr><td className="px-6 py-4 font-bold">10–20%</td><td className="px-6 py-4">Below Avg</td><td className="px-6 py-4">Below Avg</td></tr>
                  <tr><td className="px-6 py-4 font-bold">20–30%</td><td className="px-6 py-4">Average</td><td className="px-6 py-4">Average</td></tr>
                  <tr className="bg-brand-gold/5"><td className="px-6 py-4 font-black text-brand-dark">30–40%</td><td className="px-6 py-4 font-bold">High</td><td className="px-6 py-4 font-bold">High</td></tr>
                  <tr className="bg-brand-gold/10"><td className="px-6 py-4 font-black text-brand-dark">40%+</td><td className="px-6 py-4 font-black text-brand-green">Highest</td><td className="px-6 py-4 font-black text-brand-green">Highest</td></tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-amber-50 p-6 rounded-2xl border-l-4 border-amber-400">
              <h4 className="text-amber-900 font-black uppercase tracking-widest text-[10px] mb-2">Important Statistical Principle</h4>
              <p className="text-sm text-amber-900 m-0">Correlation measures association. It does not establish causation.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tighter border-b-2 border-brand-gold pb-2 inline-block">5. What Else Could Explain Higher Participation?</h2>
            <p>Election statistics alone cannot determine voter motivation. A massive surge in voter participation is rarely driven by a single factor. Other possible contributing factors include:</p>
            <ul>
              <li><strong>First-time voters:</strong> Over 1.45 million new youth voters registered in this cycle.</li>
              <li><strong>Competitive election:</strong> The entry of a major third force disrupted the traditional bipolar contest, increasing competitiveness.</li>
              <li><strong>Electoral roll revision:</strong> The Election Commission's cleanup of dead/duplicate voters may have increased the density of active voters.</li>
              <li><strong>Political realignment & Anti-incumbency:</strong> Shifts in traditional Dravidian vote banks.</li>
            </ul>
          </section>

          {/* Evidence Summary */}
          <section className="bg-brand-dark text-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
              <BarChart3 className="text-brand-gold" /> Evidence Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="border-b border-white/20 text-brand-gold font-black uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Evidence</th>
                    <th className="px-4 py-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-medium">
                  <tr>
                    <td className="px-4 py-4">Did more people vote?</td>
                    <td className="px-4 py-4 text-brand-green">Supported</td>
                    <td className="px-4 py-4"><span className="bg-brand-green/20 text-brand-green px-3 py-1 rounded-full text-xs font-bold">High</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Did participation exceed expected natural voter growth?</td>
                    <td className="px-4 py-4 text-brand-green">Supported</td>
                    <td className="px-4 py-4"><span className="bg-brand-green/20 text-brand-green px-3 py-1 rounded-full text-xs font-bold">High</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Were gains stronger in urban constituencies?</td>
                    <td className="px-4 py-4 text-blue-400">Supported by analysis</td>
                    <td className="px-4 py-4"><span className="bg-blue-400/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">Moderate</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4">Did higher TVK vote share coincide with higher vote growth?</td>
                    <td className="px-4 py-4 text-blue-400">Positive association</td>
                    <td className="px-4 py-4"><span className="bg-blue-400/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">Moderate</span></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-4 font-bold">Does the data prove Vijay caused the increase?</td>
                    <td className="px-4 py-4 text-red-400 font-bold">No</td>
                    <td className="px-4 py-4"><span className="bg-red-400/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">Low</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Important Interpretation Rules */}
          <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
            <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Info className="text-brand-gold" /> Important Interpretation Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <div className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Facts</div>
                <p className="font-medium text-brand-dark">Tamil Nadu recorded more votes than in 2021.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <div className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Observations</div>
                <p className="font-medium text-brand-dark">Urban constituencies recorded larger average vote growth.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <div className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Statistical Relationships</div>
                <p className="font-medium text-brand-dark">Constituencies with higher TVK vote share often experienced larger increases in votes cast.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 border-l-4 border-l-brand-gold">
                <div className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Interpretation</div>
                <p className="font-medium text-brand-dark">These findings are consistent with the hypothesis that TVK's emergence may have helped mobilize previously disengaged voters.</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 border-l-4 border-l-red-500 md:col-span-2">
                <div className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Not Proven</div>
                <p className="font-medium text-brand-dark">Election statistics alone cannot establish that TVK caused additional voter participation.</p>
              </div>
            </div>
          </section>

          {/* Final Verdict */}
          <section className="border-t-4 border-brand-dark pt-12 mt-4 space-y-8">
            <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">Final Verdict</h2>
            
            <div>
              <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-2">What the Evidence Shows</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 font-medium">
                <li>Tamil Nadu recorded its highest number of votes cast.</li>
                <li>Votes increased despite the electoral roll shrinking after SIR.</li>
                <li>Urban constituencies generally recorded larger increases in actual votes.</li>
                <li>Constituencies with stronger TVK performance frequently experienced higher vote growth.</li>
                <li>Baseline calculations estimate approximately 3.62 lakh additional voters beyond expected natural voter growth.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-brand-dark mb-4 border-b pb-2">What the Evidence Suggests</h3>
              <p className="text-slate-600 font-medium leading-relaxed mb-4">
                The timing of TVK's emergence coincided with Tamil Nadu recording its highest voter participation in history.
              </p>
              <p className="text-slate-600 font-medium leading-relaxed mb-4">
                After accounting for expected first-time voters, approximately 3.62 lakh additional voters participated beyond the projected baseline.
              </p>
              <p className="text-slate-600 font-medium leading-relaxed mb-4">
                Urban constituencies generally recorded stronger growth in actual votes cast, and constituencies with higher TVK vote share frequently experienced larger increases in voter participation.
              </p>
              <p className="text-slate-600 font-medium leading-relaxed">
                Taken together, these findings are consistent with the hypothesis that TVK's emergence may have encouraged sections of previously disengaged voters to participate in the election.
              </p>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border-l-4 border-red-500">
              <h3 className="text-red-900 font-bold uppercase tracking-widest text-xs mb-3">What the Evidence Does NOT Prove</h3>
              <p className="text-red-800 font-medium leading-relaxed mb-2">
                None of the analyses presented establish a direct causal relationship between TVK's entry into politics and increased voter participation.
              </p>
              <p className="text-red-800/80 text-sm">
                Additional evidence such as voter surveys, exit polls, or behavioural studies would be required to establish causation.
              </p>
            </div>

            <div className="bg-brand-dark text-white p-8 rounded-3xl mt-8 shadow-2xl">
              <h3 className="text-brand-gold font-black uppercase tracking-widest text-[10px] mb-4">Final Conclusion</h3>
              <p className="text-lg leading-relaxed font-medium">
                The available election data indicates that the timing of TVK's emergence coincided with Tamil Nadu recording its highest voter participation in history. After accounting for expected first-time voters, approximately 3.62 lakh additional voters participated beyond the projected baseline. Urban constituencies generally recorded stronger growth in votes cast, and constituencies with higher TVK vote share frequently experienced larger increases in voter participation. While these findings do not establish causation, they are consistent with the possibility that TVK's emergence helped mobilize sections of previously disengaged voters.
              </p>
            </div>
          </section>

          {/* Related Analysis CTA */}
          <section className="mt-8 pt-12 border-t border-slate-100 flex flex-col items-center">
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-6">Explore the Source Data</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/tn/analysis/voters-trend" className="bg-slate-50 text-brand-dark px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-brand-dark hover:text-brand-gold transition-colors">Voters Trend</Link>
              <Link href="/tn/election-analysis/constituency-wise-votes-polled-2021-vs-2026" className="bg-slate-50 text-brand-dark px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-brand-dark hover:text-brand-gold transition-colors">Constituency-wise Votes</Link>
              <Link href="/tn/analysis/urban-rural-2026-comparison" className="bg-slate-50 text-brand-dark px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-brand-dark hover:text-brand-gold transition-colors">Urban vs Rural Analysis</Link>
              <Link href="/tn/analysis/tvk-vote-share-turnout-constituency-level" className="bg-slate-50 text-brand-dark px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs border border-slate-200 hover:bg-brand-dark hover:text-brand-gold transition-colors">TVK Vote Share Analysis</Link>
            </div>
          </section>

          {/* External References */}
          <section className="mt-12 pt-12 border-t border-slate-100">
            <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight mb-6">References & Works Cited</h3>
            <ol className="list-decimal pl-5 space-y-4 text-sm text-slate-600 font-medium break-all">
              <li>
                <strong className="text-brand-dark mr-2">2026 Tamil Nadu Legislative Assembly election - Wikipedia</strong><br/>
                <a href="https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election</a>
              </li>
              <li>
                <strong className="text-brand-dark mr-2">Tamil Nadu (84.69%) and West Bengal (Phase-I) (91.78%) record highest-ever poll participation since Independence - PIB</strong><br/>
                <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2255010" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://www.pib.gov.in/PressReleasePage.aspx?PRID=2255010</a>
              </li>
              <li>
                <strong className="text-brand-dark mr-2">ELECTORS DATA SUMMARY - Election Commission of India</strong><br/>
                <a href="https://hindi.eci.gov.in/files/file/11089-%E0%A4%A4%E0%A4%AE%E0%A4%BF%E0%A4%B2%E0%A4%A8%E0%A4%BE%E0%A4%A1%E0%A5%81-%E0%A4%B5%E0%A4%BF%E0%A4%A7%E0%A4%BE%E0%A4%A8%E0%A4%B8%E0%A4%AD%E0%A4%BE-%E0%A4%A8%E0%A4%BF%E0%A4%B0%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%9A%E0%A4%A8-%E0%A4%95%E0%A4%BE-%E0%A4%B8%E0%A4%BE%E0%A4%B0%E0%A4%82%E0%A4%96%E0%A5%8D%E0%A4%AF%E0%A4%BF%E0%A4%95%E0%A5%80%E0%A4%AF-%E0%A4%A1%E0%A5%87%E0%A4%9F%E0%A4%BE-2021/?do=download&r=27803&confirm=1&t=1&csrfKey=1a8d07d42a0f67de8cc527d5f539e101" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://hindi.eci.gov.in/files/file/11089-तमि...</a>
              </li>
              <li>
                <strong className="text-brand-dark mr-2">Tamil Nadu electorate at 6.10 crore as per EC draft rolls - The Hindu</strong><br/>
                <a href="https://www.thehindu.com/news/national/tamil-nadu/tamil-nadu-electorate-at-610-crore-as-per-ec-draft-rolls/article33106497.ece" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://www.thehindu.com/news/national/tamil-nadu/tamil-nadu-electorate-at-610-crore-as-per-ec-draft-rolls/article33106497.ece</a>
              </li>
              <li>
                <strong className="text-brand-dark mr-2">Tamil Nadu Assembly election 2026: Over 50 lakh more people voted compared to 2024 Lok Sabha polls - The Hindu</strong><br/>
                <a href="https://www.thehindu.com/elections/tamil-nadu-assembly/tn-assembly-elections-over-50-lakh-morevoters-exercise-their-franchise-this-time-compared-to-2024-lok-sabha-polls/article70905327.ece" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://www.thehindu.com/elections/tamil-nadu-assembly/tn-assembly-elections-over-50-lakh-morevoters-exercise-their-franchise-this-time-compared-to-2024-lok-sabha-polls/article70905327.ece</a>
              </li>
              <li>
                <strong className="text-brand-dark mr-2">ELECTORS DATA SUMMARY - Election Commission (2016)</strong><br/>
                <a href="https://hindi.eci.gov.in/files/file/3473-%E0%A4%A4%E0%A4%AE%E0%A4%BF%E0%A4%B2%E0%A4%A8%E0%A4%BE%E0%A4%A1%E0%A5%81-%E0%A4%B5%E0%A4%BF%E0%A4%A7%E0%A4%BE%E0%A4%A8%E0%A4%B8%E0%A4%AD%E0%A4%BE-%E0%A4%A8%E0%A4%BF%E0%A4%B0%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%9A%E0%A4%A8-%E0%A4%95%E0%A4%BE-%E0%A4%B8%E0%A4%BE%E0%A4%B0%E0%A4%82%E0%A4%96%E0%A5%8D%E0%A4%AF%E0%A4%BF%E0%A4%95%E0%A5%80%E0%A4%AF-%E0%A4%A1%E0%A5%87%E0%A4%9F%E0%A4%BE-2016/?do=download&r=8130&confirm=1&t=1&csrfKey=3d5160bd5a69a016cb3d55f4891443fd" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://hindi.eci.gov.in/files/file/3473-तमि...</a>
              </li>
            </ol>
          </section>

        </div>
      </main>
    </div>
  );
}
