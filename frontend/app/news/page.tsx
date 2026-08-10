import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import React from 'react';
import Link from 'next/link';
import CoverImage from '@/components/CoverImage';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';

export async function generateMetadata() {
  return buildMetadata({
    title: "News & Analysis",
    description: "Deep dives into Tamil Nadu's political data, legislative performance, and constituency insights.",
    path: "/news",
    keywords: ["Tamil Nadu Politics News", "MLA Analysis", "Legislative Performance", "Political Data"]
  });
}

export default function NewsListPage() {
  const blogs = [
    {
      title: "Did the Vijay Factor Increase Voter Turnout? A Data-Driven Investigation",
      slug: "did-vijay-factor-increase-voter-turnout",
      date: "August 10, 2026",
      readTime: "5 min",
      description: "Did Vijay's political debut increase voter participation in Tamil Nadu? Explore constituency-wise votes polled, urban-rural voting trends, and TVK vote share analysis.",
      category: "Investigation"
    },
    {
      title: "TVK Vote Share vs Voter Turnout: Constituency Level Analysis",
      href: "/tn/analysis/tvk-vote-share-turnout-constituency-level",
      date: "August 10, 2026",
      readTime: "4 min",
      description: "Explore whether constituencies where TVK secured a higher vote share also experienced larger increases in actual votes polled between 2021 and 2026.",
      category: "Analysis"
    },
    {
      title: "Urban vs Rural Voting Trends in Tamil Nadu (2026)",
      href: "/tn/analysis/urban-rural-2026-comparison",
      date: "August 9, 2026",
      readTime: "4 min",
      description: "An interactive analysis comparing voter turnout patterns between urban, semi-urban, and rural constituencies across Tamil Nadu.",
      category: "Analysis"
    },
    {
      title: "Tamil Nadu Voters Trend Analysis (2016-2026)",
      href: "/tn/analysis/voters-trend",
      date: "August 9, 2026",
      readTime: "5 min",
      description: "Dive into the historical voter participation trends, gender-based voting patterns, and demographic shifts over the last three assembly elections.",
      category: "Analysis"
    },
    {
      title: "18 MLAs with 100% Assembly Attendance in Tamil Nadu (2021–2026)",
      slug: "tamil-nadu-mlas-100-percent-attendance-2021-2026",
      date: "March 21, 2026",
      readTime: "4 min",
      description: "Discover the 18 Tamil Nadu MLAs who maintained perfect attendance in the Assembly from 2021 to 2026. Explore their profiles and performance data.",
      category: "Analysis"
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg flex flex-col">
      <CoverImage 
        title="News & Analysis" 
        subtitle="Deep dives into Tamil Nadu's political data, legislative performance, and constituency insights."
      >
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-3 text-white/20">/</span>
          <span className="text-brand-gold">News</span>
        </nav>
      </CoverImage>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="flex justify-between items-end mb-12">
            <div>
                <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Latest Articles</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">In-depth reporting on civic performance</p>
            </div>
            <div className="hidden md:block">
                <span className="text-[10px] bg-brand-dark text-white font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-lg flex items-center gap-2">
                    <BookOpen size={12} className="text-brand-gold" />
                    {blogs.length} {blogs.length === 1 ? 'Article' : 'Articles'}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, idx) => (
            <Link 
              key={idx} 
              href={blog.href || `/news/${blog.slug}`}
              className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full"
            >
              {/* Card Image Placeholder / Category */}
              <div className="h-48 bg-[#16232e] p-8 flex flex-col justify-end relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-gold/20 transition-colors"></div>
                <span className="bg-brand-gold text-brand-dark text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4 relative z-10">
                  {blog.category}
                </span>
                <h3 className="text-white font-black text-xl leading-tight group-hover:text-brand-gold transition-colors relative z-10 line-clamp-2">
                  {blog.title}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-8 flex-1 flex flex-col">
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                  {blog.description}
                </p>

                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-300" />
                      {blog.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-300" />
                      {blog.readTime}
                    </div>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-dark group-hover:text-brand-gold transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {blogs.length === 0 && (
          <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-slate-200">
            <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight mb-2">No articles found</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Check back soon for new analysis</p>
          </div>
        )}
      </main>
    </div>
  );
}
