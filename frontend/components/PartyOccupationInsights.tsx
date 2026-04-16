"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Briefcase, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface PartyOccupationInsightsProps {
  data: any;
}

const COLORS = ["#164C45", "#D4AF37", "#059669", "#0891B2", "#4F46E5", "#7C3AED"];

export default function PartyOccupationInsights({ data }: PartyOccupationInsightsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { distribution, top } = data;

  const chartData = distribution
    .filter((d: any) => d.value > 0)
    .sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
          <Briefcase size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Occupation Insights</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Professional background profile</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
           {top.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                 <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">#{index + 1}</span>
                    <span className="text-sm font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">{item.name}</span>
                 </div>
                 <span className="text-lg font-black text-brand-gold">{item.value}</span>
              </div>
           ))}
        </div>

        <div className="h-[300px] w-full">
           {isMounted && (
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
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {chartData.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>
      
      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border-l-4 border-indigo-500">
        <div className="flex items-start gap-4">
           <TrendingUp className="text-indigo-500 shrink-0 mt-1" size={20} />
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
            &ldquo;Professional profile analysis: The most dominant professional background among its candidates is {top[0]?.name?.toLowerCase() || "others"}. This diversity across {top.length} distinct occupation categories reflects its candidate selection strategy.&rdquo;
           </p>
        </div>
      </div>
    </div>
  );
}
