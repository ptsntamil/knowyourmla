import Link from "next/link";
import { ConstituencyResponse, DistrictMLA } from "@/types/models";

interface ConstituencyListProps {
  constituencies: ConstituencyResponse[];
  mlas?: DistrictMLA[];
}

export default function ConstituencyList({ constituencies, mlas = [] }: ConstituencyListProps) {
  const mlaMap = mlas.reduce((acc, mla) => {
    acc[mla.constituencyId] = mla;
    return acc;
  }, {} as Record<string, DistrictMLA>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {constituencies.map((constituency) => {
        const slug = constituency.id.replace("CONSTITUENCY#", "").toLowerCase();
        const mla = mlaMap[constituency.id];

        return (
          <div 
            key={constituency.id} 
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-gold/30 transition-all hover:-translate-y-1 h-full flex flex-col justify-between space-y-8 group"
          >
            {/* Top Area: Name & Badge */}
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h4 className="text-xl font-black text-brand-dark uppercase tracking-tight leading-tight capitalize min-w-0 flex-1">
                  {constituency.name.toLowerCase()}
                </h4>
                <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0 shadow-sm border border-black/5 ${
                  constituency.type === 'SC' ? 'bg-brand-yellow/10 text-brand-yellow' :
                  constituency.type === 'ST' ? 'bg-brand-green/10 text-brand-green' :
                  'bg-brand-gold/10 text-brand-gold'
                }`}>
                  {constituency.type}
                </span>
              </div>
              
              {/* Middle Area: Current MLA */}
              <div className="pt-6 border-t border-slate-50 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Current MLA</p>
                {mla ? (
                  <div className="space-y-3">
                    <Link href={`/tn/mla/${mla.slug}`} className="block group">
                      <h5 className="text-lg font-black text-brand-dark group-hover:text-brand-gold transition-colors tracking-tight leading-tight">
                        {mla.name}
                      </h5>
                    </Link>
                    <div 
                      className="px-3 py-1.5 text-[9px] font-black rounded-full uppercase tracking-wider border flex items-center gap-2 w-fit shadow-sm transition-transform hover:scale-105 active:scale-95"
                      style={{ 
                        backgroundColor: mla.partyColor || '#f8fafc',
                        color: mla.partyColorText || (mla.partyColor ? '#ffffff' : '#1e293b'),
                        borderColor: mla.partyColorBorder || '#e2e8f0'
                      }}
                    >
                      {mla.partyLogoUrl && (
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20">
                          <img src={mla.partyLogoUrl} alt={mla.partyShort} className="w-3 h-3 object-contain" />
                        </div>
                      )}
                      {mla.partyShort}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-300 italic uppercase tracking-widest">Data unavailable</p>
                )}
              </div>
            </div>

            {/* Bottom Area: CTAs */}
            <div className="pt-6 border-t border-slate-50">
              <Link 
                href={`/tn/constituency/${slug}`}
                className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-gold transition-colors flex items-center group/btn whitespace-nowrap"
              >
                View History
                <svg className="ml-2 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="9 5l7 7-7 7" />
                </svg>
              </Link>

            </div>
          </div>
        );
      })}
    </div>
  );
}
