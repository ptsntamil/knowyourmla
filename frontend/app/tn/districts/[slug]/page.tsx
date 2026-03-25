import Link from "next/link";
import { fetchConstituencies, fetchDistrictDetails } from "@/services/api";
import ConstituencyList from "@/components/ConstituencyList";
import CoverImage from "@/components/CoverImage";
import { getBaseMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const districtName = slug.toUpperCase();
  return getBaseMetadata(
    `${districtName} District MLAs and Constituencies`,
    `List of all constituencies and MLAs in ${districtName} district Tamil Nadu.`,
    `/tn/districts/${slug}`,
    [`${districtName} District`, "Tamil Nadu Politics", "MLA List", "Constituency Details"]
  );
}

export default async function DistrictPage({ params }: PageProps) {
  const { slug } = await params;
  const districtId = `DISTRICT#${slug}`;
  
  // Fetch both constituencies and district details (for stats)
  const [constituencies, districtDetails] = await Promise.all([
    fetchConstituencies(districtId),
    fetchDistrictDetails(districtId)
  ]);

  const latestStats = districtDetails.stats && districtDetails.stats.length > 0 ? districtDetails.stats[0] : null;

  return (
    <div className="min-h-screen bg-page-bg">
      <CoverImage 
        title={`${slug} District`} 
        subtitle={`Total of ${constituencies.length} legislative constituencies representing the people of ${slug}.`}
      >
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          <Link href="/tn" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-3 text-white/20">/</span>
          <Link href="/tn" className="hover:text-white transition-colors">Tamil Nadu</Link>
          <span className="mx-3 text-white/20">/</span>
          <span className="text-brand-gold">{slug}</span>
        </nav>
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Constituencies</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legislative segments within {slug} district</p>
            </div>
            <ConstituencyList constituencies={constituencies} />
          </div>

          {/* District Gender Distribution Card */}
          {latestStats && latestStats.male !== undefined && (
            <div className="lg:col-span-1 bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm p-10 space-y-10 lg:sticky lg:top-8">
              <div className="space-y-2">
                <h3 className="font-black text-brand-dark uppercase tracking-widest text-sm">District Electorate</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aggregated Data ({latestStats.year})</p>
              </div>
              
              <div className="space-y-8">
                {/* Male */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male</span>
                    <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latestStats.male?.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-dark rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((latestStats.male || 0) / latestStats.total_electors) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Female */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female</span>
                    <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latestStats.female?.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-gold rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((latestStats.female || 0) / latestStats.total_electors) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Third Gender */}
                {latestStats.third_gender !== undefined && latestStats.third_gender > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Others</span>
                      <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latestStats.third_gender.toLocaleString()}</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(latestStats.third_gender / latestStats.total_electors) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Electors</span>
                  <span className="text-lg font-black text-brand-green" suppressHydrationWarning>{latestStats.total_electors.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed text-center">
                  This chart represents the combined voter population across all {constituencies.length} constituencies in the district.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>


    </div>
  );
}
