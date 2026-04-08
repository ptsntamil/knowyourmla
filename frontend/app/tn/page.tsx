import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import Link from "next/link";
import { TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { StateService } from "@/lib/services/state.service";
import { DistrictService } from "@/lib/services/district.service";
import CoverImage from "@/components/CoverImage";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";
import SectionHeader from "@/components/ui/SectionHeader";

// New Components
import StateStatsHeroPills from "@/components/state/StateStatsHeroPills";
import StateSnapshot from "@/components/state/StateSnapshot";
import StateHighlights from "@/components/state/StateHighlights";
import CompositionInsights from "@/components/state/CompositionInsights";
import DistrictExplorer from "@/components/state/DistrictExplorer";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "Tamil Nadu MLA Overview | State Results, Demographics & Analytics",
    description: "Access a complete overview of Tamil Nadu assembly data. Explore MLA demographics, party-wise seat share, education trends, and district-level political insights for all 234 constituencies.",
    path: "/tn",
    keywords: [
      "Tamil Nadu MLA List", 
      "TN Assembly Snapshot", 
      "Tamil Nadu Election Analytics", 
      "MLAs by District", 
      "Know Your MLA Tamil Nadu"
    ]
  });
}

export default async function TNPage() {
  const stateService = new StateService();
  const districtService = new DistrictService();

  const [stateOverview] = await Promise.all([
    stateService.getStateOverview()
  ]);

  const {
    totalConstituencies,
    totalMLAs,
    totalDistricts,
    partySpread,
    insights,
    distributions,
    districts,
    districtCountMap
  } = stateOverview;



  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema 
        items={[
          commonBreadcrumbs.home
        ]} 
      />
      <ItemListSchema 
        items={districts.map((d: any, index: number) => ({
          name: d.name,
          url: `/tn/districts/${d.slug}`,
          position: index + 1
        }))} 
      />

      <CoverImage
        title="Tamil Nadu"
        subtitle="A flagship hub for state-level political intelligence, providing complete transparency into Tamil Nadu's legislative landscape."
      >
        <div className="space-y-6">
          <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-3 text-white/20">/</span>
            <span className="text-brand-gold">Tamil Nadu</span>
          </nav>

          <StateStatsHeroPills 
            totalConstituencies={totalConstituencies}
            totalMLAs={totalMLAs}
            totalDistricts={totalDistricts}
            partySpread={partySpread}
          />
        </div>
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-20 space-y-32">
        
        {/* 1. State Snapshot */}
        <section className="space-y-12">
          <SectionHeader 
            title="State Snapshot" 
            subtitle="High-level metrics and demographics of the current Tamil Nadu Legislative Assembly."
          />
          <StateSnapshot 
            totalConstituencies={totalConstituencies}
            totalMLAs={totalMLAs}
            insights={insights}
          />
        </section>

        {/* 2. State Highlights */}
        <section className="space-y-12">
          <SectionHeader 
            title="MLA Key Highlights" 
            subtitle="Spotlighting the notable representatives across various performance and demographic markers."
          />
          <StateHighlights 
            youngestMla={insights.youngestMla}
            oldestMla={insights.oldestMla}
            richestMla={insights.richestMla}
            highestMarginMla={insights.highestMarginMla}
            highestVotesMla={insights.highestVotesMla}
          />

        </section>

        {/* 3. Composition Insights */}
        <section className="space-y-12">
          <SectionHeader 
            title="Assembly Composition" 
            subtitle="Visualizing the diversity and background of state-level representation."
          />
          <CompositionInsights distributions={distributions} />
        </section>

        {/* 4. Election Central - NEW Discoverability Hub */}
        <section className="space-y-12 pt-12 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <SectionHeader 
              title="Election Intelligence" 
              subtitle="Deep dives into historical results, regional patterns, and candidate analytics."
            />
            <Link 
              href="/tn/elections/2021"
              className="text-brand-gold font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group hover:underline underline-offset-8 transition-all"
            >
              Browse Election Archive
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link 
              href="/tn/elections/2021"
              className="group relative bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-brand-gold/10 transition-all active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
                  <TrendingUp size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">2021 Results Hub</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Official assembly results, constituency mapping, and party-wise seat distributions for the latest election.</p>
                </div>
                <div className="pt-4 flex items-center gap-3 text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                  View Results <ArrowRight size={14} />
                </div>
              </div>
            </Link>

            <Link 
              href="/tn/elections/2021/insights"
              className="group relative bg-brand-dark rounded-[3rem] p-10 shadow-2xl hover:shadow-brand-gold/20 transition-all active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="space-y-6 relative z-10">
                <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-dark">
                  <BarChart3 size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Deep Analytics</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Richest candidates, closest contests, women representation, and regional strongholds analyzed for the 2021 assembly.</p>
                </div>
                <div className="pt-4 flex items-center gap-3 text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                  Full Insights <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* 4. District Explorer */}
        <section id="districts" className="pt-12 border-t border-slate-100">
          <DistrictExplorer 
            districts={districts}
            countMap={districtCountMap}
          />
        </section>

        {/* Footer CTA */}
        <div className="bg-brand-dark rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Detailed MLA Profiles</h2>
            <p className="text-slate-400 font-medium">Looking for a specific representative? View the complete searchable directory of all current Tamil Nadu MLAs.</p>
          </div>
          <Link
            href="/tn/mla/list"
            className="inline-flex bg-brand-gold text-brand-dark font-black px-10 py-4 rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-white transition-all relative z-10"
          >
            Explore Full MLA List
          </Link>
        </div>

      </main>
    </div>
  );
}

