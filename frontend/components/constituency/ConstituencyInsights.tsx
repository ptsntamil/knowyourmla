import React from "react";
import { 
  Shield, 
  Hexagon, 
  Activity, 
  Users, 
  RefreshCcw 
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { 
  getSeatType, 
  getPartyLeaning, 
  getTurnoutTrend, 
  getElectorProfile,
  getPoliticalStability
} from "@/lib/constituency-helpers";

interface ConstituencyInsightsProps {
  history: any[];
  stats: any[];
}

export default function ConstituencyInsights({ history, stats }: ConstituencyInsightsProps) {
  const seatType = getSeatType(history, stats);
  const partyLeaning = getPartyLeaning(history);
  const turnoutTrend = getTurnoutTrend(stats);
  const electorProfile = getElectorProfile(stats);
  const stability = getPoliticalStability(history);

  const insights = [
    {
      label: "Seat Type",
      value: seatType,
      description: `This constituency shows ${seatType.toLowerCase()} election outcomes in recent cycles.`,
      icon: Shield,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Party Leaning",
      value: partyLeaning,
      description: partyLeaning.includes("Stronghold") 
        ? "One party has shown consistent dominance here." 
        : partyLeaning === "Alliance-sensitive" 
        ? "Outcome often depends on party alliances."
        : "No single party has consistently dominated recent elections.",
      icon: Hexagon,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      label: "Turnout Trend",
      value: turnoutTrend,
      description: `Voter turnout has ${turnoutTrend.toLowerCase()} in recent elections.`,
      icon: Activity,
      color: "text-brand-green bg-brand-green/5 border-brand-green/10",
    },
    {
      label: "Elector Profile",
      value: electorProfile,
      description: electorProfile === "Female-led electorate" 
        ? "Female voters outnumber male voters in this constituency."
        : electorProfile === "Male-led electorate"
        ? "Male voters outnumber female voters in this constituency."
        : "Balanced representation across genders.",
      icon: Users,
      color: "text-brand-gold bg-brand-gold/5 border-brand-gold/10",
    },
  ];

  // Optional 5th card if stability is interesting
  if (stability === "High change" || stability === "Moderate change") {
    insights.push({
      label: "Political Stability",
      value: stability,
      description: "The winning party has changed frequently across elections.",
      icon: RefreshCcw,
      color: "text-orange-600 bg-orange-50 border-orange-100",
    });
  }

  return (
    <section className="space-y-8">
      <SectionHeader 
        title="Constituency Insights" 
        subtitle="Key trends and characteristics based on recent elections."
        badge={<Badge variant="slate" dot>AI-Derived Insights</Badge>}
      />

      <div className={`grid gap-6 ${insights.length === 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {insights.map((insight, idx) => (
          <div 
            key={idx}
            className={`flex flex-col p-6 rounded-[2rem] border bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] group ${insight.color}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12 ${insight.color} bg-opacity-20 border-opacity-20`}>
              <insight.icon size={24} />
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {insight.label}
              </p>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-tight text-slate-900">
                {insight.value}
              </h3>
            </div>
            
            <p className="mt-4 text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
