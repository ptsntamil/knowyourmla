import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import SEOIntro from "@/components/seo/SEOIntro";
import CoverImage from "@/components/CoverImage";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Briefcase, Calendar, User } from "lucide-react";
import { PortfolioHistoryRecord } from "@/types/models";
import { inferGovernmentAndCabinet, formatPortfolioName } from "@/lib/utils/historyHelpers";
import CabinetEventBadge from "@/components/tn/CabinetEventBadge";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  const titleName = formatPortfolioName(normalizedSlug);

  return buildMetadata({
    title: `${titleName} Portfolio History | Tamil Nadu Cabinet`,
    description: `Complete historical timeline of ministers who held the ${titleName} portfolio in the Tamil Nadu Cabinet.`,
    path: `/tn/portfolios/${normalizedSlug}`,
    keywords: [`${titleName} minister tamil nadu`, `tamil nadu cabinet portfolio`, `history of ${titleName} department`]
  });
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Normalize slug to remove hyphens/spaces
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // If the requested slug has hyphens or uppercase, return 404
  if (slug !== normalizedSlug) {
    notFound();
  }

  const { PortfolioService } = await import("@/lib/services/portfolio.service");
  const { PersonRepository } = await import("@/lib/repositories/person.repository");
  const portfolioService = new PortfolioService();
  const personRepo = new PersonRepository();
  const timeline = await portfolioService.getPortfolioTimeline(slug);

  const displayTitle = formatPortfolioName(slug);

  // Sort timeline chronologically descending
  const sortedTimeline = [...timeline].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  // Create a map of minister names
  const uniqueMinisterIds = Array.from(new Set(timeline.map(r => r.minister_id)));
  const ministerNames = new Map<string, string>();
  
  await Promise.all(uniqueMinisterIds.map(async (ministerId) => {
    const person = await personRepo.getPersonById(ministerId);
    if (person) {
      ministerNames.set(ministerId, person.name);
    } else {
      // Fallback for unknown ministers
      const slugMatch = ministerId.replace('PERSON#', '');
      let fallbackName = slugMatch.replace(/UNKNOWN_/g, '').replace(/_/g, ' ');
      // capitalize words
      fallbackName = fallbackName.replace(/\b\w/g, (l: string) => l.toUpperCase());
      ministerNames.set(ministerId, fallbackName);
    }
  }));

  const breadcrumbs = [
    commonBreadcrumbs.home,
    { name: "Ministers", item: "https://www.knowyourmla.in/tn/ministers" },
    { name: displayTitle, item: `https://www.knowyourmla.in/tn/portfolios/${slug}` }
  ];

  const currentRecord = sortedTimeline.find(r => !r.end_date);
  const latestRecord = sortedTimeline[0];
  const activeRecord = currentRecord || latestRecord;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-gold/30">
      <BreadcrumbSchema items={breadcrumbs} />
      
      <CoverImage title={`${displayTitle} Portfolio`}>
        <div className="flex flex-col items-center space-y-4">
          <Badge variant="brand" size="sm" dot>Portfolio History</Badge>
          <nav className="flex justify-center items-center space-x-2 text-sm font-black uppercase tracking-widest text-slate-300">
            <Link href="/tn/ministers" className="hover:text-white transition-colors">Ministers</Link>
            <span className="opacity-50">/</span>
            <span className="text-brand-gold">{displayTitle}</span>
          </nav>
        </div>
      </CoverImage>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <SEOIntro 
          h1={`History of ${displayTitle} Portfolio`}
          intro={`Historical timeline of all ministers who have held the ${displayTitle} portfolio in the Tamil Nadu cabinet.`}
        />

        {sortedTimeline.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center border border-slate-100 shadow-xl">
            <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No History Found</h3>
            <p className="text-slate-500 mt-2">We couldn't find any historical records for this portfolio.</p>
          </div>
        ) : (
          <>
            {/* Current Responsibility Section */}
            {activeRecord && (
              <section className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8">
                <h2 className="text-sm font-black text-brand-dark uppercase tracking-widest mb-6 flex items-center gap-2">
                  <User size={16} className="text-brand-gold" />
                  {currentRecord ? "Current Responsibility" : "Latest Responsibility"}
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Minister</div>
                    <Link href={`/tn/mla/${activeRecord.minister_id.replace('PERSON#', '')}`}>
                      <div className="text-xl font-black text-brand-dark hover:text-brand-gold transition-colors">
                        {ministerNames.get(activeRecord.minister_id)}
                      </div>
                    </Link>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Term</div>
                    <div className="text-sm font-bold text-slate-600">
                      {activeRecord.start_date} &mdash; {activeRecord.end_date || "Present"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {activeRecord.government || 'Tamil Nadu Government'}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-6">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-4">
                Ministers Responsible
              </h2>
              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden p-8 md:p-12">
                <div className="relative border-l-4 border-slate-100 ml-4 space-y-12">
                  {sortedTimeline.map((record, index) => {
                    const isCurrent = !record.end_date;
                    const endDateStr = record.end_date || "Present";
                    
                    // Try to get proper name representation
                    const ministerNameSlug = record.minister_id.replace('PERSON#', '');
                    const ministerDisplayName = ministerNames.get(record.minister_id) || ministerNameSlug;
                    
                    const { government, cabinet } = inferGovernmentAndCabinet(
                      record.start_date, 
                      record.government || '', 
                      record.cabinet || ''
                    );
                    
                    return (
                      <div key={record.id || index} className="relative pl-8">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[14px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${isCurrent ? 'bg-brand-gold' : 'bg-slate-300'}`}>
                          {isCurrent && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 group hover:border-brand-gold/30 transition-colors">
                          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <Link href={`/tn/mla/${ministerNameSlug}`}>
                                  <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight hover:text-brand-gold transition-colors">
                                    {ministerDisplayName}
                                  </h3>
                                </Link>
                                {isCurrent && (
                                  <span className="text-[10px] bg-brand-green/10 text-brand-green font-black px-2 py-1 rounded uppercase tracking-wider">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                                <Calendar size={12} className="text-brand-gold" />
                                <span>{record.start_date} &mdash; {endDateStr}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Government</div>
                              <div className="text-xs font-black text-brand-dark">{government}</div>
                              <div className="text-xs font-bold text-slate-500 mt-1">{cabinet}</div>
                            </div>
                          </div>
                          
                          <CabinetEventBadge event={record.cabinet_event || record.event_type || record.reason_for_change} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
