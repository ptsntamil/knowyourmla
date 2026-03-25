import { Metadata } from "next";
import { getBaseMetadata } from "@/lib/seo";
import Link from "next/link";
import { fetchMLAs } from "@/services/api";
import CoverImage from "@/components/CoverImage";
import Image from "next/image";

export const metadata: Metadata = getBaseMetadata(
  "Current MLAs",
  "List of elected members of the Tamil Nadu Legislative Assembly (2021-2026).",
  "tn/mla/list",
  ["MLA List", "Tamil Nadu MLAs", "Elected Members", "Constituency Wise MLAs"]
);

// Static generation for better performance
export const revalidate = 3600; // revalidate every hour

export default async function MLAListPage() {
  const { mlas } = await fetchMLAs();

  return (
    <div className="min-h-screen bg-page-bg">
      <CoverImage 
        title="Current MLAs" 
        subtitle="List of elected members of the Tamil Nadu Legislative Assembly (2021-2026)."
      >
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          <Link href="/tn" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-3 text-white/20">/</span>
          <Link href="/tn" className="hover:text-white transition-colors">Tamil Nadu</Link>
          <span className="mx-3 text-white/20">/</span>
          <span className="text-brand-gold">MLA List</span>
        </nav>
      </CoverImage>
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-12">
            <div>
                <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Elected Members</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Displaying all 234 current MLAs by constituency</p>
            </div>
            <div className="hidden md:block">
                <span className="text-[10px] bg-brand-dark text-white font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-lg">
                    {mlas.length} MLAs
                </span>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Constituency</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MLA Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Party</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Period</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {mlas.map((mla) => (
                            <tr key={mla.constituency_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-4">
                                    <Link 
                                        href={`/tn/constituency/${mla.constituency_id.replace("CONSTITUENCY#", "")}`}
                                        className="text-sm font-bold text-brand-dark hover:text-brand-gold transition-colors inline-flex items-center"
                                    >
                                        {mla.constituency}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </Link>
                                </td>
                                <td className="px-8 py-4">
                                    {mla.person_id ? (
                                        <Link 
                                            href={`/tn/mla/${mla.person_id.replace("PERSON#", "")}`}
                                            className="text-sm font-black text-slate-800 hover:text-brand-gold transition-colors"
                                        >
                                            {mla.name}
                                        </Link>
                                    ) : (
                                        <span className="text-sm font-medium text-slate-300 italic">Not Available</span>
                                    )}
                                </td>
                                <td className="px-8 py-4">
                                    <span 
                                        className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-3 w-fit shadow-sm border whitespace-nowrap transition-colors"
                                        style={{
                                            backgroundColor: mla.party_color_bg || '#f8fafc',
                                            color: mla.party_color_text || '#1e293b',
                                            borderColor: mla.party_color_border || '#e2e8f0'
                                        }}
                                    >
                                        {mla.party_logo_url && (
                                            <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner">
                                                <Image 
                                                    src={mla.party_logo_url} 
                                                    alt={mla.party} 
                                                    width={32}
                                                    height={32}
                                                    className="object-contain" 
                                                />
                                            </div>
                                        )}
                                        {mla.party}
                                    </span>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="text-xs font-bold text-slate-500 tabular-nums">
                                        {mla.period}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </main>


    </div>
  );
}
