import { Trophy, Users, CheckCircle2, TrendingUp, Star, Calendar, TrendingDown, ShieldAlert, Map, Medal } from "lucide-react";

interface PartySummaryStatsProps {
  stats: any;
  depositLost?: any;
  isYearView?: boolean;
}

export default function PartySummaryStats({ stats, depositLost, isYearView }: PartySummaryStatsProps) {
  if (!stats) return null;

  const metrics = [
    {
      label: isYearView ? "Seats Contested" : "Elections Contested",
      value: isYearView ? stats.totalContested || 0 : (stats.totalElections || stats.totalContested || (stats.years?.length) || 0),
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: isYearView ? "Deposit Saved" : "Candidates Fielded",
      value: isYearView ? (depositLost?.depositSavedCount || 0) : (stats.totalContested || 0),
      icon: isYearView ? <ShieldAlert className="w-5 h-5" /> : <Users className="w-5 h-5" />,
      color: isYearView ? "bg-purple-500/10 text-purple-500" : "bg-purple-500/10 text-purple-500",
    },
    {
      label: "Seats Won",
      value: stats.totalWins || 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      label: "Win Rate",
      value: `${stats.winRate || 0}%`,
      icon: <Trophy className="w-5 h-5" />,
      color: "bg-brand-gold/10 text-brand-gold",
    },
    ...(isYearView ? [
      {
        label: "Districts Won",
        value: depositLost?.districtsWon || 0,
        icon: <Map className="w-5 h-5" />,
        color: "bg-indigo-500/10 text-indigo-500",
      },
      {
        label: "2nd Places",
        value: depositLost?.secondPlaces || 0,
        icon: <Medal className="w-5 h-5" />,
        color: "bg-cyan-500/10 text-cyan-500",
      },
      {
        label: "3rd Places",
        value: depositLost?.thirdPlaces || 0,
        icon: <Star className="w-5 h-5" />,
        color: "bg-orange-500/10 text-orange-500",
      }
    ] : []),
    {
      label: isYearView ? "Deposit Lost" : "Best Performance",
      value: isYearView ? (depositLost?.depositLostCount || 0) : (stats.bestYear || "N/A"),
      subValue: isYearView ? undefined : (stats.maxWins ? `${stats.maxWins} seats` : undefined),
      icon: isYearView ? <TrendingDown className="w-5 h-5" /> : <Star className="w-5 h-5" />,
      color: isYearView ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500",
    },
    {
      label: isYearView ? "Loss Percentage" : "Historical Peak",
      value: isYearView ? `${(depositLost?.depositLossPercentage || 0).toFixed(1)}%` : (stats.latestYear || stats.firstYear || "N/A"),
      icon: isYearView ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />,
      color: isYearView ? "bg-rose-500/10 text-rose-500" : "bg-rose-500/10 text-rose-500",
    },
  ];

  return (
    <div id="overview" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex flex-col gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metric.color}`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-500 transition-colors">
                {metric.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-brand-dark dark:text-slate-100 uppercase tracking-tight">
                  {metric.value}
                </span>
                {metric.subValue && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {metric.subValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
