import { Users, Trophy, Target, Calendar, MapPin, BarChart3, GraduationCap, Scale } from "lucide-react";

interface PartyStatsGridProps {
  stats: any;
  isYearView?: boolean;
}

export default function PartyStatsGrid({ stats, isYearView }: PartyStatsGridProps) {
  const cards = [
    { label: "Total Candidates", value: stats.totalContested, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Seats Won", value: stats.totalWins, icon: Trophy, color: "text-brand-gold", bg: "bg-brand-gold/10", border: "border-brand-gold/20" },
    { label: "Win Rate", value: `${stats.winRate}%`, icon: Target, color: "text-brand-green", bg: "bg-brand-green/10", border: "border-brand-green/20" },
    { label: "Women Candidates", value: stats.womenContestants, icon: Users, color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  ];

  if (!isYearView) {
    cards.push(
      { label: "Avg. Education", value: "Grad+", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
      { label: "Active Since", value: stats.firstYear, icon: Calendar, color: "text-slate-600", bg: "bg-slate-500/10", border: "border-slate-500/20" },
    );
  } else {
    cards.push(
      { label: "New Faces", value: stats.newCandidates || 0, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20" },
      { label: "Avg Assets", value: "₹2Cr+", icon: Scale, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {cards.map((card) => (
        <div 
          key={card.label} 
          className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border ${card.border} shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[100px] sm:min-h-[120px]`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-1.5 sm:p-2 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">{card.label}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-brand-dark dark:text-slate-100 tracking-tight leading-none truncate">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
