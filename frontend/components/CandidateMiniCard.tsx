import Link from "next/link";
import { Trophy, ArrowRight, Shield, Scale, ChevronRight } from "lucide-react";
import ProfileImage from "./ProfileImage";

interface CandidateMiniCardProps {
  c: any;
}

export default function CandidateMiniCard({ c }: CandidateMiniCardProps) {
  const formatCurrency = (amt: any) => {
    const val = parseInt(amt || 0);
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(0)} L`;
    return val.toLocaleString();
  };

  return (
    <Link
      href={`/tn/mla/${c.person_id?.replace("PERSON#", "")}`}
      className="group relative bg-white dark:bg-slate-900 border border-border/50 rounded-2xl p-4 hover:border-brand-gold/40 hover:shadow-xl transition-all duration-300 flex items-center gap-4"
    >
      {/* Result Indicator Badge handled by Trophy or Result Tag */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-border/20 shrink-0">
        <ProfileImage
          src={c.profile_pic}
          alt={c.candidate_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight truncate group-hover:text-brand-gold transition-colors">
            {c.candidate_name}
            </h4>
            {c.is_winner && (
            <Trophy size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            )}
        </div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
          {c.constituency_id?.replace("CONSTITUENCY#", "").replace(/-/g, " ")}
          <span className="text-slate-300">•</span>
          {c.election_year || c.year}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center gap-1 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase">
            <Scale size={10} className="text-emerald-500/70" />
            ₹{formatCurrency(c.total_assets)}
          </div>
          {c.criminal_cases > 0 && (
            <div className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase">
              <Shield size={10} />
              {c.criminal_cases} Cases
            </div>
          )}
          {c.is_winner ? (
             <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-[7px] font-black text-emerald-600 dark:text-emerald-400 rounded uppercase tracking-tighter">Winner</span>
          ) : (
             <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[7px] font-black text-slate-400 rounded uppercase tracking-tighter">Runner</span>
          )}
        </div>
      </div>

      <div className="text-slate-300 group-hover:text-brand-gold transition-colors">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}
