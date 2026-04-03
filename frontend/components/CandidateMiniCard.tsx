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
      className="group relative bg-bg-card border border-border-subtle rounded-2xl p-4 hover:border-text-accent/40 hover:shadow-xl transition-all duration-300 flex items-center gap-4"
    >
      {/* Result Indicator Badge handled by Trophy or Result Tag */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-bg-surface rounded-xl overflow-hidden shadow-inner border border-border-subtle shrink-0">
        <ProfileImage
          src={c.profile_pic}
          alt={c.candidate_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-black text-text-primary uppercase tracking-tight truncate group-hover:text-text-accent transition-colors">
            {c.candidate_name}
            </h4>
            {c.is_winner && (
             <Trophy size={14} className="text-text-primary shrink-0 mt-0.5" />
            )}
        </div>
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 truncate">
          {c.constituency_id?.replace("CONSTITUENCY#", "").replace(/-/g, " ")}
          <span className="text-border-default">•</span>
          {c.election_year || c.year}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex items-center gap-1 text-[8px] font-black text-text-muted uppercase">
            <Scale size={10} className="text-text-primary/70" />
            ₹{formatCurrency(c.total_assets)}
          </div>
          {c.criminal_cases > 0 && (
            <div className="flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase">
              <Shield size={10} />
              {c.criminal_cases} Cases
            </div>
          )}
          {c.is_winner ? (
             <span className="px-1.5 py-0.5 bg-bg-accent/20 text-[7px] font-black text-text-primary rounded uppercase tracking-tighter">Winner</span>
          ) : (
             <span className="px-1.5 py-0.5 bg-bg-muted text-[7px] font-black text-text-muted rounded uppercase tracking-tighter border border-border-subtle">Runner</span>
          )}
        </div>
      </div>

      <div className="text-text-muted group-hover:text-text-accent transition-colors">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}
