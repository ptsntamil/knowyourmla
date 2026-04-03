import { Users, Trophy, Target, Calendar, MapPin, BarChart3, GraduationCap, Scale } from "lucide-react";

interface PartyStatsGridProps {
  stats: any;
  isYearView?: boolean;
}

export default function PartyStatsGrid({ stats, isYearView }: PartyStatsGridProps) {
  const cards = [
    { label: "Total Candidates", value: stats.totalContested, icon: Users, color: "text-text-secondary", bg: "bg-bg-accent/10", border: "border-border-accent/20" },
    { label: "Seats Won", value: stats.totalWins, icon: Trophy, color: "text-text-accent", bg: "bg-bg-accent/20", border: "border-border-accent/30" },
    { label: "Win Rate", value: `${stats.winRate}%`, icon: Target, color: "text-text-primary", bg: "bg-bg-surface/20", border: "border-border-subtle/30" },
    { label: "Women Candidates", value: stats.womenContestants, icon: Users, color: "text-text-secondary", bg: "bg-bg-accent/10", border: "border-border-accent/20" },
  ];

  if (!isYearView) {
    cards.push(
      { label: "Avg. Education", value: "Grad+", icon: GraduationCap, color: "text-text-primary", bg: "bg-bg-surface/20", border: "border-border-subtle/30" },
      { label: "Active Since", value: stats.firstYear, icon: Calendar, color: "text-text-muted", bg: "bg-bg-accent/10", border: "border-border-accent/20" },
    );
  } else {
    cards.push(
      { label: "New Faces", value: stats.newCandidates || 0, icon: BarChart3, color: "text-text-secondary", bg: "bg-bg-accent/10", border: "border-border-accent/20" },
      { label: "Avg Assets", value: "₹2Cr+", icon: Scale, color: "text-text-primary", bg: "bg-bg-surface/20", border: "border-border-subtle/30" },
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {cards.map((card) => (
        <div 
          key={card.label} 
          className={`bg-bg-card rounded-2xl p-4 sm:p-5 border ${card.border} shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[100px] sm:min-h-[120px]`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-1.5 sm:p-2 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon size={16} className="sm:w-5 sm:h-5" />
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 truncate">{card.label}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight leading-none truncate">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
