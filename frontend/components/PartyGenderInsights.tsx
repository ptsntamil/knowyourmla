"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Venus, Mars } from "lucide-react";

interface PartyGenderInsightsProps {
  data: any;
}

export default function PartyGenderInsights({ data }: PartyGenderInsightsProps) {
  const { male, female, femalePercentage } = data;

  const chartData = [
    { name: "Female", value: female, color: "#CC8D1A" },
    { name: "Male", value: male, color: "#164C45" }
  ].filter(d => d.value > 0);

  return (
    <div className="bg-bg-card rounded-[2.5rem] p-6 sm:p-10 border border-border-subtle shadow-sm space-y-8 sm:space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-3 sm:p-4 bg-bg-surface text-text-primary rounded-2xl shrink-0">
          <Venus size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">Gender Diversity</h3>
          <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Candidate representation profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="h-[220px] sm:h-[250px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="95%"
                paddingAngle={8}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
               <Tooltip 
                contentStyle={{ backgroundColor: '#16232E', borderRadius: '1rem', border: '1px solid #164C45', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', fontSize: '10px', fontWeight: '900' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-text-primary leading-none">{femalePercentage}%</span>
            <span className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest">Women</span>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
           <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle">
              <div className="p-2 sm:p-3 bg-bg-card text-text-primary rounded-xl shrink-0">
                 <Mars size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Male Candidates</p>
                 <p className="text-2xl sm:text-3xl font-black text-text-primary leading-none">{male}</p>
              </div>
           </div>

           <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-bg-accent/10 rounded-2xl sm:rounded-3xl border border-border-accent/20">
              <div className="p-2 sm:p-3 bg-bg-accent text-text-inverse rounded-xl shrink-0">
                 <Venus size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] sm:text-[10px] font-black text-text-accent uppercase tracking-widest mb-0.5">Female Candidates</p>
                 <p className="text-2xl sm:text-3xl font-black text-text-accent leading-none">{female}</p>
              </div>
           </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 bg-bg-surface rounded-2xl border border-border-subtle">
        <p className="text-[10px] sm:text-xs font-medium text-text-muted leading-relaxed italic">
          &ldquo;Representation analysis: Within this context, {femalePercentage}% of candidates are female. Gender diversity metrics reflect the party&apos;s democratic outreach efforts.&rdquo;
        </p>
      </div>
    </div>
  );
}
