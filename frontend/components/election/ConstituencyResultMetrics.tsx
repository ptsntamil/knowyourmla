import { 
  Trophy, 
  Users, 
  TrendingUp, 
  UserMinus, 
  BarChart3, 
  PieChart 
} from "lucide-react";
import { CandidateResultRow } from "@/lib/services/election-analytics.service";

interface ConstituencyResultMetricsProps {
  winner: CandidateResultRow;
  runnerUp?: CandidateResultRow;
  margin: number;
  turnoutPercent?: number;
  totalCandidates: number;
  totalVotesPolled?: number;
}

export default function ConstituencyResultMetrics({
  winner,
  runnerUp,
  margin,
  turnoutPercent,
  totalCandidates,
  totalVotesPolled
}: ConstituencyResultMetricsProps) {
  const metrics = [
    {
      label: "Winner",
      value: winner.name,
      subValue: `${winner.partyShort} • ${winner.votes.toLocaleString()} Votes`,
      icon: Trophy,
      color: "bg-brand-gold/10 text-brand-gold",
      borderColor: "border-brand-gold/20"
    },
    {
      label: "Runner-up",
      value: runnerUp?.name || "N/A",
      subValue: runnerUp ? `${runnerUp.partyShort} • ${runnerUp.votes.toLocaleString()} Votes` : "No runner-up data",
      icon: UserMinus,
      color: "bg-slate-100 text-slate-500",
      borderColor: "border-slate-200"
    },
    {
      label: "Winning Margin",
      value: margin.toLocaleString(),
      subValue: "Votes gap from runner-up",
      icon: TrendingUp,
      color: "bg-brand-green/10 text-brand-green",
      borderColor: "border-brand-green/20"
    },
    {
      label: "Voter Turnout",
      value: turnoutPercent ? `${turnoutPercent}%` : "N/A",
      subValue: "Percentage of total electors",
      icon: PieChart,
      color: "bg-blue-50 text-blue-500",
      borderColor: "border-blue-100"
    },
    {
      label: "Total Candidates",
      value: totalCandidates.toString(),
      subValue: "Candidates contested",
      icon: Users,
      color: "bg-purple-50 text-purple-500",
      borderColor: "border-purple-100"
    },
    {
      label: "Total Votes Polled",
      value: totalVotesPolled ? totalVotesPolled.toLocaleString() : "N/A",
      subValue: "Valid + Rejected votes",
      icon: BarChart3,
      color: "bg-orange-50 text-orange-500",
      borderColor: "border-orange-100"
    }
  ];

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Election Snapshot</h2>
        <p className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
          Key performance indicators for this election
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, idx) => (
          <div 
            key={idx}
            className={`bg-white rounded-[2rem] p-8 border ${metric.borderColor} shadow-sm hover:shadow-md transition-all group overflow-hidden relative`}
          >
            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 transition-transform group-hover:scale-150 ${metric.color.split(' ')[0]}`} />
            
            <div className="relative z-10 space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${metric.color} ring-1 ring-inset ring-current/10`}>
                <metric.icon size={24} />
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {metric.label}
                </p>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-brand-dark truncate tracking-tight uppercase" title={metric.value}>
                    {metric.value}
                  </span>
                  <span className="text-xs font-bold text-slate-500 tracking-tight">
                    {metric.subValue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
