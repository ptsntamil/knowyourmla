import { notFound } from "next/navigation";
import { ExpenditureService } from "@/lib/services/expenditure-service";
import { buildMetadata } from "@/lib/seo/metadata";
import { ExpenditureAnalytics } from "@/components/expenditure/ExpenditureAnalytics";
import { ReportingScopeBadge } from "@/components/expenditure/ReportingScopeBadge";
import { ExpenditurePartyFaq } from "@/components/expenditure/ExpenditurePartyFaq";
import { ChevronRight, ArrowLeft, Info, FileCheck, ShieldAlert, FileText, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import React from "react";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const ELECTION_ID = "ELECTION#2026#ASSEMBLY#GENERAL";

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const partyId = `PARTY#${slug}`;
  const report = await ExpenditureService.getElectionExpenditureReport(ELECTION_ID, partyId);
  
  if (!report) {
    return buildMetadata({
      title: "Not Found",
      description: "Expenditure not found",
      path: `/tn/election-expenditure/2026/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${report.party_short} Election Expenditure 2026: Spending & Disclosure | KnowYourMLA`,
    description: `Explore the reported 2026 election expenditure of ${report.party_full}, including campaign advertising, travel, materials, rallies and candidate-related expenditure, with reporting scope and source details.`,
    path: `/tn/election-expenditure/2026/${slug}`,
  });
}

const formatRs = (val?: number) => val != null ? `₹${val.toLocaleString("en-IN")}` : "Not disclosed";
const formatCr = (val?: number) => {
  if (val == null) return "—";
  if (val === 0) return "₹0";
  return `₹${(val / 10000000).toFixed(2)} Cr`;
};

// Group mapping
const getGroupName = (catName: string, isCandidate: boolean) => {
  if (isCandidate) {
    if (catName.toLowerCase().includes("lump-sum") || catName.toLowerCase().includes("funding") || catName.toLowerCase().includes("payments")) return "Candidate Funding";
    if (catName.toLowerCase().includes("media")) return "Candidate Media";
    if (catName.toLowerCase().includes("material")) return "Candidate Materials";
    if (catName.toLowerCase().includes("rall") || catName.toLowerCase().includes("public meeting")) return "Candidate Rallies";
    if (catName.toLowerCase().includes("criminal")) return "Criminal Antecedent Publication";
    return "Other Candidate Expenditure";
  } else {
    if (catName.toLowerCase().includes("media") || catName.toLowerCase().includes("virtual")) return "Media & Digital Advertising";
    if (catName.toLowerCase().includes("material")) return "Campaign Materials";
    if (catName.toLowerCase().includes("travel")) return "Campaign Travel";
    if (catName.toLowerCase().includes("rall") || catName.toLowerCase().includes("procession") || catName.toLowerCase().includes("public meeting")) return "Public Meetings & Rallies";
    return "Other Party Propaganda";
  }
};

const TooltipValue = ({ val }: { val?: number }) => (
  <span className="group relative inline-block cursor-help border-b border-dashed border-slate-400">
    {formatCr(val)}
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 transition-opacity group-hover:opacity-100 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl z-50">
      {formatRs(val)}
    </span>
  </span>
);

export default async function PartyExpenditurePage({ params }: PageProps) {
  const { slug } = await params;
  const partyId = `PARTY#${slug}`;
  const allReports = await ExpenditureService.getAllElectionExpenditureReports(ELECTION_ID);
  const currentIndex = allReports.findIndex(r => r.party_id === partyId);
  const report = allReports[currentIndex];
  
  if (!report) notFound();

  const prevParty = currentIndex > 0 ? allReports[currentIndex - 1] : null;
  const nextParty = currentIndex < allReports.length - 1 ? allReports[currentIndex + 1] : null;

  const totalExp = report.reported_total_rs || 0;
  const genProp = report.general_propaganda_rs || 0;
  const candExp = report.candidate_expenditure_rs || 0;

  const genPct = totalExp > 0 ? ((genProp / totalExp) * 100).toFixed(2) : "0.00";
  const candPct = totalExp > 0 ? ((candExp / totalExp) * 100).toFixed(2) : "0.00";

  const categories = report.categories || [];
  
  // Sorting categories by amount descending
  const sortedCategories = [...categories].sort((a, b) => (b.amount_rs || 0) - (a.amount_rs || 0));
  const majorCategories = sortedCategories.filter(c => c.amount_rs && c.amount_rs > 0).slice(0, 5);

  // Grouping
  const genCats = sortedCategories.filter(c => c.expenditure_group === 'GENERAL_PROPAGANDA');
  const candCats = sortedCategories.filter(c => c.expenditure_group === 'CANDIDATE_EXPENDITURE' || c.expenditure_group === 'CAMPAIGN' || c.expenditure_group === 'COMPLIANCE');

  // Concentration Insight
  let insight = null;
  if (genProp > 0 && genCats.length >= 2) {
    const top2 = genCats.slice(0, 2);
    const combined = (top2[0].amount_rs || 0) + (top2[1].amount_rs || 0);
    const combinedPct = ((combined / genProp) * 100).toFixed(2);
    if (parseFloat(combinedPct) > 50) {
      insight = {
        pct: combinedPct,
        amount: combined,
        names: top2.map(c => c.display_category_name).join(" and ")
      };
    }
  }

  // Hierarchy building
  const groupedGenProp = genCats.reduce((acc, cat) => {
    const groupName = getGroupName(cat.category_name, false);
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(cat);
    return acc;
  }, {} as Record<string, typeof genCats>);

  const groupedCandExp = candCats.reduce((acc, cat) => {
    const groupName = getGroupName(cat.category_name, true);
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(cat);
    return acc;
  }, {} as Record<string, typeof candCats>);

  const orderedGenPropGroups = ["Media & Digital Advertising", "Campaign Materials", "Campaign Travel", "Public Meetings & Rallies", "Other Party Propaganda"];
  const orderedCandExpGroups = ["Candidate Funding", "Candidate Media", "Candidate Materials", "Candidate Rallies", "Criminal Antecedent Publication", "Other Candidate Expenditure"];

  return (
    <main className="min-h-screen bg-slate-50/50 pb-32">
      <ExpenditureAnalytics />
      
      {/* 1. COMPACT HERO */}
      <section className="bg-brand-dark text-white pt-6 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">
            <Link href="/tn/analysis/2026-election-expenditure" className="hover:text-brand-gold transition-colors">Election Expenditure</Link>
            <ChevronRight size={12} />
            <span>2026</span>
            <ChevronRight size={12} />
            <span className="text-brand-gold">{report.party_short}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2">
                {report.party_full} ({report.party_short})
              </h1>
              <p className="text-xl text-brand-gold font-bold mb-6">
                Election Expenditure 2026
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <ReportingScopeBadge scope={report.report_scope} />
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-slate-200">
                  <FileCheck size={12} />
                  <span>{report.source_type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-6 relative z-20 space-y-12">
        
        {/* 2. EXPENDITURE AT A GLANCE (Composition) */}
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Expenditure Composition</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Reported Total</p>
              <p className="text-3xl font-black text-brand-dark"><TooltipValue val={report.reported_total_rs} /></p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">General Propaganda</p>
              <p className="text-2xl font-black text-brand-dark"><TooltipValue val={report.general_propaganda_rs} /></p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Candidate Exp.</p>
              <p className="text-2xl font-black text-brand-dark"><TooltipValue val={report.candidate_expenditure_rs} /></p>
            </div>
          </div>

          {totalExp > 0 && (
            <div className="space-y-3">
              <div className="w-full bg-slate-100 rounded-full h-6 flex overflow-hidden">
                <div className="bg-brand-gold h-full" style={{ width: `${genPct}%` }} title="General Propaganda"></div>
                <div className="bg-brand-dark h-full" style={{ width: `${candPct}%` }} title="Candidate Expenditure"></div>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-brand-gold">{genPct}% General</span>
                <span className="text-brand-dark">{candPct}% Candidate</span>
              </div>
              <p className="text-xs text-slate-400 italic mt-2">Percentages are derived from the reported total and calculated by KnowYourMLA.</p>
            </div>
          )}
        </section>

        {/* 11. SOURCE NOTE (Compact) */}
        {(report.reconciliation_difference_rs || report.data_quality_note) && (
          <section className="bg-brand-gold/10 border border-brand-gold/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <ShieldAlert className="text-brand-gold flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="font-bold text-brand-dark text-base mb-1">Source Note</h3>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">{report.data_quality_note}</p>
                {report.reconciliation_difference_rs && (
                  <details className="group">
                    <summary className="text-xs font-bold text-brand-gold cursor-pointer hover:underline list-none inline-flex items-center gap-1">
                      View calculation details <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/50 rounded-xl p-4 border border-brand-gold/20 text-sm">
                      <div>
                        <span className="block text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Reported Total</span>
                        <span className="font-black text-brand-dark">{formatRs(report.reported_total_rs)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Calculated Schedule Total</span>
                        <span className="font-black text-brand-dark">{formatRs(report.calculated_category_total_rs)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Difference</span>
                        <span className="font-black text-brand-dark">{formatRs(report.reconciliation_difference_rs)}</span>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 7 & 3. MAJOR REPORTED CATEGORIES */}
        {majorCategories.length > 0 && (
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight mb-6">Major Reported Categories</h2>
            <div className="space-y-6">
              {majorCategories.map(cat => {
                const isCand = cat.expenditure_group === 'CANDIDATE_EXPENDITURE' || cat.expenditure_group === 'CAMPAIGN' || cat.expenditure_group === 'COMPLIANCE';
                const denominator = isCand ? candExp : genProp;
                const pct = denominator > 0 && cat.amount_rs ? ((cat.amount_rs / denominator) * 100).toFixed(2) : null;
                const width = denominator > 0 && cat.amount_rs ? Math.max((cat.amount_rs / denominator) * 100, 1) : 0;
                
                return (
                  <div key={cat.category_id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="font-bold text-slate-800 block text-sm">{cat.display_category_name}</span>
                        {pct && <span className="text-xs text-slate-500 font-medium">{pct}% of {isCand ? 'candidate expenditure' : 'general propaganda'}</span>}
                      </div>
                      <div className="font-black text-brand-dark text-lg"><TooltipValue val={cat.amount_rs} /></div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`${isCand ? 'bg-brand-dark' : 'bg-brand-gold'} h-full rounded-full`} style={{ width: `${width}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 8. SPENDING CONCENTRATION */}
        {insight && (
          <section className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
            <Info className="text-brand-dark flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-slate-700 text-sm leading-relaxed">
                <strong>{insight.names}</strong> account for <span className="font-black text-brand-dark bg-brand-gold/20 px-1 rounded">{insight.pct}%</span> of the party's general propaganda expenditure (Combined: {formatCr(insight.amount)}).
              </p>
            </div>
          </section>
        )}

        {/* 4 & 5. GENERAL PROPAGANDA HIERARCHY */}
        {genCats.length > 0 && (
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">General Propaganda Breakdown</h2>
            </div>
            <div className="p-8 space-y-10">
              {orderedGenPropGroups.map(groupName => {
                const catsInGroup = groupedGenProp[groupName];
                if (!catsInGroup || catsInGroup.length === 0) return null;
                
                return (
                  <div key={groupName} className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{groupName}</h3>
                    {catsInGroup.map(cat => {
                      const pct = genProp > 0 && cat.amount_rs ? ((cat.amount_rs / genProp) * 100).toFixed(2) : null;
                      const width = genProp > 0 && cat.amount_rs ? Math.max((cat.amount_rs / genProp) * 100, 1) : 0;
                      return (
                        <div key={cat.category_id} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <span className="font-bold text-slate-800 block text-sm">{cat.display_category_name}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{cat.source_section}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-brand-dark block text-lg"><TooltipValue val={cat.amount_rs} /></span>
                              {pct && <span className="text-xs text-slate-500 font-medium">{pct}% of general propaganda</span>}
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-gold h-full rounded-full" style={{ width: `${width}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. CANDIDATE EXPENDITURE HIERARCHY */}
        {candCats.length > 0 && (
          <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Candidate Expenditure Breakdown</h2>
            </div>
            <div className="p-8 space-y-10">
              {orderedCandExpGroups.map(groupName => {
                const catsInGroup = groupedCandExp[groupName];
                if (!catsInGroup || catsInGroup.length === 0) return null;
                
                return (
                  <div key={groupName} className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{groupName}</h3>
                    {catsInGroup.map(cat => {
                      const pct = candExp > 0 && cat.amount_rs ? ((cat.amount_rs / candExp) * 100).toFixed(2) : null;
                      const width = candExp > 0 && cat.amount_rs ? Math.max((cat.amount_rs / candExp) * 100, 1) : 0;
                      return (
                        <div key={cat.category_id} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <span className="font-bold text-slate-800 block text-sm">{cat.display_category_name}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{cat.source_section}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-brand-dark block text-lg"><TooltipValue val={cat.amount_rs} /></span>
                              {pct && <span className="text-xs text-slate-500 font-medium">{pct}% of candidate exp.</span>}
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-dark h-full rounded-full" style={{ width: `${width}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 9. REPORTING SCOPE & 10. SOURCE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-black text-brand-dark uppercase tracking-widest text-xs mb-4">Reporting Scope</h3>
            <p className="font-bold text-brand-dark text-lg mb-4">{report.report_scope}</p>
            <details className="group">
              <summary className="text-sm font-bold text-brand-gold cursor-pointer hover:underline list-none inline-flex items-center gap-1">
                Why does reporting scope matter? <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Party expenditure reports may cover Tamil Nadu alone, multiple states, or a state-unit section depending on the source filing. Figures with different reporting scopes should not automatically be treated as directly comparable.
              </p>
            </details>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-brand-dark uppercase tracking-widest text-xs mb-4">Source Information</h3>
              <p className="font-bold text-slate-700 text-sm mb-1">{report.source_type}</p>
              <p className="text-slate-500 text-sm mb-4">Election: 2026 Assembly</p>
            </div>
            {/* Real link logic would go here if URLs were in the DB. Placeholder for visual adherence. */}
            <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-brand-dark transition-colors">
              <FileText size={16} /> View original source <ChevronRight size={14} />
            </a>
          </div>
        </section>

        <ExpenditurePartyFaq report={report} />

        {/* 13. PARTY NAVIGATION */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-12 border-t border-slate-200">
          {prevParty ? (
            <Link href={`/tn/election-expenditure/2026/${prevParty.party_id.replace("PARTY#", "")}`} className="w-full sm:w-auto bg-white border border-slate-200 hover:border-brand-gold px-6 py-4 rounded-xl text-center sm:text-left transition-colors group">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center sm:justify-start gap-1"><ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Previous Party</span>
              <span className="block font-black text-brand-dark">{prevParty.party_short}</span>
            </Link>
          ) : <div className="hidden sm:block"></div>}
          
          <Link href="/tn/analysis/2026-election-expenditure" className="w-full sm:w-auto text-center text-sm font-bold text-slate-500 hover:text-brand-gold transition-colors py-4">
            View All Parties
          </Link>

          {nextParty ? (
            <Link href={`/tn/election-expenditure/2026/${nextParty.party_id.replace("PARTY#", "")}`} className="w-full sm:w-auto bg-white border border-slate-200 hover:border-brand-gold px-6 py-4 rounded-xl text-center sm:text-right transition-colors group">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center sm:justify-end gap-1">Next Party <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" /></span>
              <span className="block font-black text-brand-dark">{nextParty.party_short}</span>
            </Link>
          ) : <div className="hidden sm:block"></div>}
        </section>

      </div>
    </main>
  );
}
