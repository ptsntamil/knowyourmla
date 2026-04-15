import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import ArticleHeader from '@/components/news/ArticleHeader';
import MLAList from '@/components/news/MLAList';
import SocialShare from '@/components/news/SocialShare';
import { ChevronRight, ArrowRight, Info, CheckCircle2, PieChart, Users } from 'lucide-react';

// SEO Metadata
// SEO Metadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  return {
    title: '18 MLAs with 100% Assembly Attendance in Tamil Nadu (2021–2026)',
    description: 'Discover the 18 Tamil Nadu MLAs who maintained 100% attendance in the Assembly from 2021 to 2026. Explore their profiles, constituencies, and performance data.',
    keywords: ['MLA Attendance', 'Tamil Nadu Assembly', '100% Attendance MLAs', 'TN Politics', 'Legislative Performance'],
    alternates: {
      canonical: `/news/${slug}`,
    },
    openGraph: {
      title: '18 MLAs with 100% Assembly Attendance in Tamil Nadu (2021–2026)',
      description: 'Explore the profiles of the 18 Tamil Nadu MLAs who never missed a day in the Assembly.',
      type: 'article',
      url: `/news/${slug}`,
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'TN MLAs 100% Attendance',
        },
      ],
    },
  };
}

export default function AttendanceNewsPage() {
  const description = 'Discover the 18 Tamil Nadu MLAs who maintained 100% attendance in the Assembly from 2021 to 2026. Explore their profiles, constituencies, and performance data.';
  const publishDate = "March 21, 2026";
  const readingTime = "4 min";
  const articleUrl = "/news/tamil-nadu-mlas-100-percent-attendance-2021-2026";
  const title = "18 MLAs with 100% Assembly Attendance in Tamil Nadu (2021–2026)";

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "datePublished": "2026-03-21T00:00:00+05:30",
    "dateModified": "2026-03-21T00:00:00+05:30",
    "author": {
      "@type": "Organization",
      "name": "KnowYourMLA Team",
      "url": "/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "KnowYourMLA",
      "logo": {
        "@type": "ImageObject",
        "url": "/KnowYourMLA_logo.png"
      }
    },
    "description": description,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-brand-gold/20 scroll-smooth">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ArticleHeader
        title={title}
        publishDate={publishDate}
        readingTime={readingTime}
      />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col gap-12">

          {/* Introduction Section */}
          <section id="introduction" className="prose prose-slate max-w-none">
            <p className="text-xl text-slate-600 leading-relaxed font-medium mb-8">
              In the 16th Tamil Nadu Legislative Assembly (2021-2026), while the sessions were marked by intense debates and historic legislations, a select group of 18 members stood out for their unmatched commitment. Out of 234 members, these 18 MLAs recorded <span className="text-brand-dark font-black border-b-2 border-brand-gold">100% attendance</span> across all 161 days of proceedings.
            </p>
            <div className="bg-brand-dark rounded-3xl p-8 text-white flex flex-col md:flex-row gap-8 items-center shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                  <Info className="text-brand-gold" /> Quick Statistics
                </h3>
                <ul className="space-y-3 text-slate-300 font-bold uppercase tracking-wider text-xs">
                  <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>Total Assembly Days:</span>
                    <span className="text-white">161 Days</span>
                  </li>
                  <li className="flex justify-between border-b border-white/5 pb-2">
                    <span>Total Members:</span>
                    <span className="text-white">234</span>
                  </li>
                  <li className="flex justify-between">
                    <span>100% Attendance Achievers:</span>
                    <span className="text-brand-gold">18 (7.7%)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-amber-50 rounded-2xl border-l-4 border-amber-400 flex gap-4 items-start">
              <Info className="text-amber-500 shrink-0 mt-1" size={20} />
              <div className="text-sm font-medium text-amber-900 leading-relaxed">
                <span className="font-black uppercase tracking-widest text-[10px] block mb-1">Important Note</span>
                As per the legislative protocol followed by the Tamil Nadu Assembly Speaker (M. Appavu), any MLA who is suspended from the house proceedings will be marked as <span className="font-black border-b border-amber-900/30">absent</span> for the duration of the suspension.
              </div>
            </div>
          </section>

          {/* Why it Matters Section */}
          <section id="why-it-matters" className="space-y-8">
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter flex items-center gap-3">
              <CheckCircle2 className="text-brand-green" /> Why Assembly Attendance Matters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-medium text-slate-600 text-lg">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-gold font-black flex-shrink-0">1</div>
                <p>Ensures that the voice of the constituency is heard during crucial policy debates.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-gold font-black flex-shrink-0">2</div>
                <p>Enables MLAs to participate in the voting process for important bills and budgets.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-gold font-black flex-shrink-0">3</div>
                <p>Demonstrates accountability and dedication to the democratic responsibilities of an elected member.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-gold font-black flex-shrink-0">4</div>
                <p>Allows for effective oversight of government schemes and departmental activities.</p>
              </div>
            </div>
          </section>

          {/* The List Section */}
          <section id="mla-list" className="scroll-mt-24">
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-4">
              MLAs with 100% Attendance
            </h2>
            <p className="text-slate-500 font-medium">Click on any profile to view detailed performance data, assets, and election history.</p>
            <MLAList />
          </section>

          {/* Insights Section */}
          <section id="insights" className="bg-slate-50 rounded-[40px] p-8 md:p-12 border border-slate-100">
            <div className="flex items-center gap-4 mb-8">
              <PieChart className="text-brand-gold" size={32} />
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">
                Party-wise Insights
              </h2>
            </div>

            <div className="space-y-8">
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                Analysis of the 100% attendance data reveals a strong discipline within the ruling alliance. The DMK leads the list significantly, demonstrating a focused approach towards legislative participation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="text-4xl font-black text-brand-dark mb-1">15</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DMK MLAs</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="text-4xl font-black text-brand-dark mb-1">1</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INC MLA</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="text-4xl font-black text-brand-dark mb-1">1</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VCK MLA</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="text-4xl font-black text-brand-dark mb-1">1</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KMDK MLA</div>
                </div>
              </div>
            </div>
          </section>

          {/* Voter Experience Section */}
          <section id="voter-experience" className="bg-brand-gold/5 rounded-[40px] p-8 md:p-12 border border-brand-gold/10">
            <div className="flex items-center gap-4 mb-8">
              <Users className="text-brand-gold" size={32} />
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">
                What This Means for Voters
              </h2>
            </div>
            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
              Consistency in assembly attendance is often a leading indicator of an MLA's dedication. For voters, this data serves as a transparent metric to evaluate if their representative is actively participating in the state's legislative process or merely occupying a seat.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-brand-dark uppercase tracking-widest py-2 border-b-2 border-brand-gold w-fit">Key Takeaway</h4>
                <p className="text-slate-500 text-sm leading-relaxed italic">
                  "High attendance does not always equate to performance, but it is the foundational requirement for any legislative work."
                </p>
              </div>
              <div className="flex flex-col justify-end items-end gap-4">
                <SocialShare url={articleUrl} title={title} />
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-8 pt-12 border-t border-slate-100 flex flex-col items-center">
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-6">Want to know more about your MLA?</h3>
            <Link
              href="/tn/mla/list"
              className="group bg-brand-dark text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 hover:bg-black transition-all shadow-xl hover:shadow-brand-gold/20"
            >
              Explore All MLA Profiles
              <ArrowRight className="group-hover:translate-x-2 transition-transform text-brand-gold" />
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}
