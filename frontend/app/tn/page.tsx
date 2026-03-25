import { Metadata } from "next";
import Link from "next/link";
import { fetchDistricts, fetchConstituencies } from "@/services/api";
import DistrictCard from "@/components/DistrictCard";
import CoverImage from "@/components/CoverImage";
import { getBaseMetadata } from "@/lib/seo";

export const metadata: Metadata = getBaseMetadata(
  "Tamil Nadu MLAs",
  "Explore comprehensive details of Members of Legislative Assembly (MLAs) in Tamil Nadu. View election history, performance, and constituency-wise data for all 234 seats.",
  "tn",
  ["Tamil Nadu MLA", "TN Election Results", "Constituency Details", "MLA Performance", "Know Your MLA"]
);

// Static generation for better performance
export const revalidate = 3600; // revalidate every hour

export default async function TNPage() {
  const [districts, allConstituencies] = await Promise.all([
    fetchDistricts(),
    fetchConstituencies()
  ]);

  // Group constituencies by district_id to get counts
  const countMap = allConstituencies.reduce((acc, c) => {
    acc[c.district_id] = (acc[c.district_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-page-bg">
      <CoverImage
        title="Tamil Nadu"
        subtitle="Comprehensive analytics on Tamil Nadu MLAs, election history, and performance trends across 234 constituencies."
      >
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          <Link href="/tn" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-3 text-white/20">/</span>
          <span className="text-brand-gold">Tamil Nadu</span>
        </nav>
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Districts of Tamil Nadu</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a district to explore its political landscape</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/tn/mla/list"
              className="text-[10px] bg-brand-gold text-brand-dark font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] border border-white/20 shadow-lg hover:bg-white hover:text-brand-dark transition-all"
            >
              View All MLAs
            </Link>
            <div className="hidden md:block">
              <span className="text-[10px] bg-brand-dark text-white font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-lg">
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
