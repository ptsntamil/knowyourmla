import Link from "next/link";
import { DistrictInsights as DistrictInsightsType, DistrictMLA } from "@/types/models";
import { Users, Trophy, Target, Star, Shield, GraduationCap, Briefcase, TrendingUp } from "lucide-react";
import Card from "@/components/ui/Card";

interface DistrictInsightsProps {
  insights: DistrictInsightsType;
}

export default function DistrictInsights({ insights }: DistrictInsightsProps) {
  if (!insights) return null;

  const {
    averageAge,
    youngestMla,
    oldestMla,
    richestMla,
    dominantParty,
    genderSplit,
    educationSummary,
    fresherVsRepeat
  } = insights;

  const statCards = [
    {
      label: "Average Age",
      value: averageAge ? `${averageAge} yrs` : "—",
      helper: "Across current MLAs",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Dominant Party",
      value: dominantParty?.party || "No clear dominant party",
      helper: dominantParty ? `${dominantParty.seats} / ${dominantParty.totalSeats} seats` : "No majority",
      icon: Shield,
      color: "text-brand-gold",
      bg: "bg-brand-gold/10"
    },
    {
      label: "Gender Split",
      value: `${genderSplit.male}M / ${genderSplit.female}W`,
      helper: "Current MLAs",
      icon: Star,
      color: "text-rose-600",
      bg: "bg-rose-50"
    },
    {
      label: "Experience",
      value: `${fresherVsRepeat.fresher} Fresh / ${fresherVsRepeat.repeat} Repeat`,
      helper: "First-time vs Multi-term",
      icon: TrendingUp,
      color: "text-brand-green",
      bg: "bg-brand-green/10"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h4 className="text-xl font-black text-brand-dark tracking-tight leading-tight">{card.value}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">{card.helper}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Standout MLA Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <MLASmCard title="Youngest MLA" mla={youngestMla} icon={Users} color="text-blue-600" />
        <MLASmCard title="Oldest MLA" mla={oldestMla} icon={Star} color="text-amber-600" />
        <MLASmCard title="Richest MLA" mla={richestMla} icon={Trophy} color="text-brand-gold" isRichest />
      </div>

      {/* Education Summary */}
      {educationSummary && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <h3 className="font-black text-brand-dark uppercase tracking-widest text-sm">Educational Profile</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Most common: <span className="text-brand-dark">{educationSummary.topCategory} ({educationSummary.count})</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {educationSummary.breakdown.slice(0, 5).map((edu) => (
                <span key={edu.label} className="px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-600 rounded-full uppercase tracking-wider border border-slate-100">
                  {edu.label}: {edu.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MLASmCard({ title, mla, icon: Icon, color, isRichest = false }: { title: string, mla: DistrictMLA | null, icon: any, color: string, isRichest?: boolean }) {
  if (!mla) return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm opacity-50">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Insufficient data</p>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-brand-gold/30 transition-colors">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <div className={color}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <h4 className="text-lg font-black text-brand-dark tracking-tight leading-tight mb-1">{mla.name}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {isRichest ? mla.formattedAssets : `${mla.age} yrs`} <span className="mx-1 text-slate-200">·</span> {mla.constituency}
        </p>
      </div>
      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
        <div 
          className="px-3 py-1.5 text-[9px] font-black rounded-full uppercase tracking-wider border flex items-center gap-2 shadow-sm"
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
        <Link 
          href={`/tn/mla/${mla.slug}`}
          className="text-[9px] font-black text-brand-gold uppercase tracking-[0.2em] hover:text-brand-green transition-colors"
        >
          View Profile →
        </Link>
      </div>
    </div>
  );
}
