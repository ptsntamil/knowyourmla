"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Briefcase, TrendingUp } from "lucide-react";

interface PartyOccupationInsightsProps {
  data: any;
}

const COLORS = ["#164C45", "#CC8D1A", "#E3C75F", "#BDA523", "#16232E"];

export default function PartyOccupationInsights({ data }: PartyOccupationInsightsProps) {
  const { distribution, top } = data;

  const chartData = distribution
    .filter((d: any) => d.value > 0)
    .sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="bg-bg-card rounded-[2.5rem] p-10 border border-border-subtle shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-bg-surface text-text-primary rounded-2xl">
          <Briefcase size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Occupation Insights</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Professional background profile</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
           {top.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-bg-surface rounded-2xl border border-border-subtle">
                 <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-bg-card flex items-center justify-center text-[10px] font-bold text-text-muted">#{index + 1}</span>
                    <span className="text-sm font-black text-text-primary uppercase tracking-tight">{item.name}</span>
                 </div>
                 <span className="text-lg font-black text-text-accent">{item.value}</span>
              </div>
           ))}
        </div>

        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                 <XAxis type="number" hide />
                 <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                 />
                 <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#16232E', borderRadius: '1rem', border: '1px solid #164C45', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                 />
                 <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                    {chartData.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
      
      <div className="p-6 bg-bg-page rounded-2xl border-l-4 border-text-primary">
        <div className="flex items-start gap-4">
           <TrendingUp className="text-text-primary shrink-0 mt-1" size={20} />
           <p className="text-xs font-medium text-text-muted leading-relaxed italic">
            &ldquo;Professional profile analysis: The most dominant professional background among its candidates is {top[0]?.name?.toLowerCase() || "others"}. This diversity across {top.length} distinct occupation categories reflects its candidate selection strategy.&rdquo;
           </p>
        </div>
      </div>
    </div>
  );
}
