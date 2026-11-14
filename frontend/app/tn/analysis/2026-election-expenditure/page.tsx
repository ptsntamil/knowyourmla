import { buildMetadata } from "@/lib/seo/metadata";
import { ExpenditureService } from "@/lib/services/expenditure-service";
import Link from "next/link";
import { ExpenditureAnalytics } from "@/components/expenditure/ExpenditureAnalytics";
import { ExpenditureKpiCards } from "@/components/expenditure/ExpenditureKpiCards";
import { PartyExpenditureTable } from "@/components/expenditure/PartyExpenditureTable";
import { ExpenditureCategoryChart } from "@/components/expenditure/ExpenditureCategoryChart";
import { CategoryExplorer } from "@/components/expenditure/CategoryExplorer";
import { ExpenditureDashboardFaq } from "@/components/expenditure/ExpenditureDashboardFaq";
import { ChevronRight, Megaphone, UserSquare2, Car, Layers, FileText, Settings, Plane, FileBadge, CheckCircle2 } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "Tamil Nadu Election Expenditure 2026: Election Spending Transparency",
    description: "Explore reported Tamil Nadu election expenditure for 2026, including media advertising, candidate funding, campaign materials, rallies, travel and other election spending, with source and reporting-scope information.",
    path: "/tn/analysis/2026-election-expenditure",
  });
}

const ELECTION_ID = "ELECTION#2026#ASSEMBLY#GENERAL";

export default async function ElectionExpenditureAnalysisPage() {
  const reports = await ExpenditureService.getAllElectionExpenditureReports(ELECTION_ID);

  // Calculate unique categories available
  const categorySet = new Set<string>();
  reports.forEach(r => {
    r.categories?.forEach(c => categorySet.add(c.category_name));
  });

  return (
    <main className="min-h-screen bg-slate-50/50 pb-32">
      <ExpenditureAnalytics />
      
      {/* SECTION 1: HERO */}
      <section className="bg-brand-dark text-white pt-20 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
              Tamil Nadu Election 2026: <br/>
              <span className="text-brand-gold">Election Expenditure Transparency</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed font-medium">
              Explore how political parties reported spending during the 2026 Tamil Nadu Assembly election, including campaign media, travel, materials, rallies and candidate-related expenditure.
            </p>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-8 inline-block backdrop-blur-sm">
              <p className="text-sm text-slate-200 m-0">
                <InfoIcon className="inline-block w-4 h-4 mr-2 text-brand-gold" />
                Figures are based on available election expenditure disclosures and published source material. Reporting scope varies by source.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#party-spending" className="bg-brand-gold text-brand-dark px-6 py-3 rounded-full font-bold hover:bg-white transition-colors">
                Explore Party Spending
              </a>
              <a href="#category-explorer" className="bg-white/10 text-white px-6 py-3 rounded-full font-bold hover:bg-white/20 transition-colors border border-white/20">
                Explore Spending Categories
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 relative z-20 space-y-24">
        {/* SECTION 2: AT A GLANCE */}
        <section>
          <ExpenditureKpiCards partyCount={reports.length} categoryCount={categorySet.size} />
        </section>

        {/* SECTION 3: WHERE DID THE MONEY GO? */}
        <section className="space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight mb-4">Where Did the Money Go?</h2>
            <p className="text-slate-600 text-lg">
              Explore the major categories of expenditure reported in the available election disclosures.
            </p>
          </div>
          <ExpenditureCategoryChart reports={reports} />
        </section>

        {/* SECTION 4: PARTY EXPENDITURE EXPLORER */}
        <section id="party-spending" className="space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight mb-4">Party Expenditure</h2>
            <p className="text-slate-600 text-lg">
              Explore reported expenditure by political party and reporting scope.
            </p>
          </div>
          <PartyExpenditureTable reports={reports} />
        </section>

        {/* SECTION 5: CATEGORY EXPLORER */}
        <section id="category-explorer" className="space-y-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight mb-4">Explore Spending Categories</h2>
            <p className="text-slate-600 text-lg">
              Select a category to see how different parties allocated funds based on their disclosures.
            </p>
          </div>
          <CategoryExplorer reports={reports} />
        </section>

        {/* SECTION 6: MEDIA & DIGITAL CAMPAIGNING */}
        <section className="bg-brand-dark text-white rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Megaphone size={200} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-black text-brand-gold uppercase tracking-tight mb-4">Media & Digital Campaigning</h2>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              For most major parties, media and digital advertising represents the largest single category of General Propaganda. 
              While some parties provide detailed breakdowns (e.g., Television, Print, Digital, Bulk SMS), many national summaries report a single aggregated media figure.
            </p>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              We present the available breakdowns only when explicitly supported by the source document. We do not infer subcategories if the source aggregates them.
            </p>
            <a href="#category-explorer" className="inline-flex items-center gap-2 bg-brand-gold text-brand-dark px-6 py-3 rounded-full font-bold hover:bg-white transition-colors">
              Explore Media Spending <ChevronRight size={18} />
            </a>
          </div>
        </section>

        {/* SECTION 7: CANDIDATE EXPENDITURE & SECTION 8: CAMPAIGN ACTIVITIES */}
        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8 md:p-10 space-y-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <UserSquare2 className="text-brand-dark" size={24} />
            </div>
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Candidate Expenditure</h2>
            <p className="text-slate-600 leading-relaxed">
              General party propaganda and candidate-related expenditure are separate reporting categories in the source data.
            </p>
            <p className="text-slate-600 leading-relaxed pb-4">
              Parties often provide lump-sum funding directly to candidates or incur specific costs on their behalf (such as candidate-specific media or criminal antecedent publication).
            </p>
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">Candidate Funding & Payments</div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">Candidate Specific Media & Materials</div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-bold text-slate-700">Criminal Antecedent Publication</div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-2">Campaign Activities</h2>
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 flex items-start gap-6 hover:border-brand-gold transition-colors">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Plane className="text-brand-dark" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark text-lg mb-1">Campaign Travel</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Reported expenditure related to campaign travel by star campaigners (e.g., chartered flights) and other leaders.</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 flex items-start gap-6 hover:border-brand-gold transition-colors">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileBadge className="text-brand-dark" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark text-lg mb-1">Campaign Materials</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Expenditure on physical visibility items like flags, banners, posters, and cut-outs across the constituencies.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 flex items-start gap-6 hover:border-brand-gold transition-colors">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Layers className="text-brand-dark" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-brand-dark text-lg mb-1">Public Meetings & Rallies</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Costs associated with organizing public processions, large rallies, and stage setups for key party leaders.</p>
              </div>
            </div>
          </section>
        </div>

        <ExpenditureDashboardFaq parties={reports.map((r: any) => r.party_short)} />

        {/* SECTION 11 & 12: UNDERSTANDING THE DATA (Replaces Data Quality warning wall) */}
        <section className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8 md:p-12 space-y-8">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
            <Settings className="text-brand-gold" size={32} />
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Understanding The Data</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-brand-dark text-lg flex items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-gold" />
                1. Reported vs Calculated Values
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                <strong>Reported Values:</strong> Amounts explicitly stated in the source document as grand totals.<br/>
                <strong>Calculated Values:</strong> The sum of individual category amounts. If they differ, we preserve both to show the source discrepancy rather than silently overwriting the data.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-brand-dark text-lg flex items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-gold" />
                2. Reporting Scope
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Election expenditure reports may cover Tamil Nadu alone, a Tamil Nadu state unit, or multiple states (e.g., TN + Puducherry + Kerala) depending on the source filing. Direct comparison between different scopes is not valid.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-brand-dark text-lg flex items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-gold" />
                3. Missing Data
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A missing value does not mean zero expenditure. "Not disclosed" indicates the source did not explicitly list an amount for that category. We display explicit ₹0 values when the source confirms zero spending.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-brand-dark text-lg flex items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-gold" />
                4. Source Limitations
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Some data comes directly from official filings, while some detailed breakdowns are extracted from published news sources. Specific data quality notes are available on each party's detailed disclosure page.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  );
}
