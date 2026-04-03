import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import { generateItemListSchema } from "@/lib/seo/jsonld";
import Link from "next/link";
import { fetchDistricts, fetchConstituencies } from "@/services/api";
import DistrictCard from "@/components/DistrictCard";
import CoverImage from "@/components/CoverImage";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";

export const revalidate = 3600;

export async function generateMetadata() {
  return buildMetadata({
    title: "Tamil Nadu MLAs | Election History, Performance & Constituency Data",
    description: "Explore comprehensive details of Members of Legislative Assembly (MLAs) in Tamil Nadu. View election history, performance metrics, and constituency-wise data for all 234 seats.",
    path: "/tn",
    keywords: ["Tamil Nadu MLA", "TN Election Results", "Constituency Details", "MLA Performance", "Know Your MLA"]
  });
}

export default async function TNPage() {
  const [districts, allConstituencies] = await Promise.all([
    fetchDistricts(),
    fetchConstituencies()
  ]);

  const countMap = allConstituencies.reduce((acc, c) => {
    acc[c.district_id] = (acc[c.district_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-bg-page">
      <BreadcrumbSchema 
        items={[
          commonBreadcrumbs.home
        ]} 
      />
      <ItemListSchema 
        items={districts.map((d: any, index: number) => ({
          name: d.name,
          url: `/tn/districts/${d.name.toLowerCase().replace(/\s+/g, '-')}`,
          position: index + 1
        }))} 
      />

      <CoverImage
        title="Tamil Nadu"
        subtitle="Comprehensive analytics on Tamil Nadu MLAs, election history, and performance trends across 234 constituencies."
      >
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-80">
          <Link href="/tn" className="hover:text-text-primary transition-colors">Home</Link>
          <span className="mx-3 text-border-subtle">/</span>
          <span className="text-text-accent">Tamil Nadu</span>
        </nav>
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-2">Districts of Tamil Nadu</h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Select a district to explore its political landscape</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tn/mla/list"
              className="text-[10px] bg-bg-accent text-text-inverse font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] border border-border-subtle shadow-lg hover:bg-bg-surface hover:text-text-primary transition-all"
            >
              View All MLAs
            </Link>
            <div className="hidden md:block">
              <span className="text-[10px] bg-bg-surface text-text-primary font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-border-subtle shadow-lg">
                {districts.length} Districts
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {districts.map((district) => (
            <DistrictCard
              key={district.id}
              district={district}
              constituencyCount={countMap[district.id] || 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
