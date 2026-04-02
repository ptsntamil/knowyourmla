import { TrendingUp, UserPlus, Shield, TrendingDown, Users, GraduationCap, UserCheck, Award } from "lucide-react";
import Link from "next/link";

interface PartyKeyInsightsProps {
  analytics: any;
}

export default function PartyKeyInsights({ analytics }: PartyKeyInsightsProps) {
  if (!analytics) return null;
  const { age, assets, criminal, education, stats, gender } = analytics;

  const insights = [
    {
      label: "Youngest",
      value: age.youngestName || "N/A",
      id: age.youngestId,
      subValue: age.youngest ? `${age.youngest} yrs` : "",
      icon: <UserPlus className="w-5 h-5" />,
      color: "text-indigo-600",
      bg: "bg-indigo-500/5",
    },
    {
      label: "Highest Assets",
      value: assets.highestName || "N/A",
      id: assets.highestId,
      subValue: assets.highest ? `₹${(assets.highest / 10000000).toFixed(1)} Cr` : "",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-600",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Women Rep.",
      value: gender.female || 0,
      subValue: "Candidates",
      icon: <Users className="w-5 h-5" />,
      color: "text-pink-600",
      bg: "bg-pink-500/5",
    },
    {
      label: "Criminal Cases",
      value: criminal.highestCandidate || "N/A",
      id: criminal.highestCandidateId,
      subValue: criminal.max ? `${criminal.max} cases` : "0 cases",
      icon: <Shield className="w-5 h-5" />,
      color: "text-rose-600",
      bg: "bg-rose-500/5",
    },
    {
      label: "Graduates",
      value: education.graduateCount || 0,
      subValue: "Candidates",
      icon: <GraduationCap className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-500/5",
    },
    {
      label: "New Faces",
      value: stats.newCandidates || 0,
      subValue: "First-timers",
      icon: <UserPlus className="w-5 h-5" />,
      color: "text-teal-600",
      bg: "bg-teal-500/5",
    },
  ];

  return (
    <div id="insights" className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-brand-dark dark:bg-slate-800 text-brand-gold rounded-2xl shrink-0">
          <Award size={20} />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Key Insights</h3>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">High-value candidate intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {insights.map((insight: any, idx) => (
          <div
            key={idx}
            className={`flex flex-col p-5 sm:p-6 rounded-2xl border border-border/50 group transition-all hover:shadow-lg ${insight.bg}`}
          >
            <div className={`p-2 rounded-xl w-fit mb-4 ${insight.color} bg-white dark:bg-slate-900 shadow-sm`}>
              {insight.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
                {insight.label}
              </p>
              {insight.id ? (
                <Link 
                  href={`/tn/mla/${insight.id}`}
                  className="text-sm sm:text-base font-black text-brand-dark dark:text-slate-100 uppercase tracking-tight truncate block hover:text-brand-gold transition-colors"
                >
                  {insight.value}
                </Link>
              ) : (
                <p className="text-sm sm:text-base font-black text-brand-dark dark:text-slate-100 uppercase tracking-tight truncate">
                  {insight.value}
                </p>
              )}
              <p className={`text-[10px] font-bold ${insight.color} mt-0.5`}>
                {insight.subValue}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
