import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import Link from "next/link";
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

