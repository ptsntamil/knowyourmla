"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Wallet, TrendingUp, Landmark, IndianRupee } from "lucide-react";

interface PartyFinancialInsightsProps {
  data: any;
}

const COLORS = ["#164C45", "#CC8D1A", "#E3C75F", "#BDA523", "#16232E"];

export default function PartyFinancialInsights({ data }: PartyFinancialInsightsProps) {
  const { average, median, crorepatiCount, crorepatiPercentage, distribution } = data;

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} Lacs`;
    return `₹${amt.toLocaleString()}`;
  };

  const chartData = distribution.filter((d: any) => d.value > 0);

  return (
    <div className="bg-bg-card rounded-[2.5rem] p-10 border border-border-subtle shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-bg-surface text-text-primary rounded-2xl">
          <Wallet size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Financial Insights</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Asset & Wealth analytics</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-bg-surface rounded-3xl border border-border-subtle">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Average Assets</p>
                  <p className="text-xl font-black text-text-primary">{formatCurrency(average)}</p>
               </div>
               <div className="p-6 bg-bg-surface rounded-3xl border border-border-subtle">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Median Assets</p>
                  <p className="text-xl font-black text-text-primary">{formatCurrency(median)}</p>
               </div>
            </div>

            <div className="p-8 bg-bg-surface rounded-[2.5rem] border border-border-subtle text-text-primary flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Crorepati Candidates</p>
                  <p className="text-5xl font-black">{crorepatiCount}</p>
                  <p className="text-xs font-bold opacity-60 mt-2">{crorepatiPercentage}% of total</p>
               </div>
               <Landmark size={64} className="opacity-10" />
            </div>
        </div>

        <div className="h-[300px] w-full relative">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 8, fontWeight: 'bold', fill: '#94a3b8' }}
                 />
                  <Tooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ backgroundColor: '#16232E', borderRadius: '1rem', border: '1px solid #164C45', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                  />
                 <Bar dataKey="value" radius={[10, 10, 0, 0]}>
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
           <IndianRupee className="text-text-primary shrink-0 mt-1" size={20} />
           <p className="text-xs font-medium text-text-muted leading-relaxed italic">
            &ldquo;Wealth profile analysis: The {crorepatiPercentage}% crorepati ratio indicates a {parseFloat(crorepatiPercentage) > 50 ? 'high-wealth' : 'middle-wealth'} candidate base. The median asset value of {formatCurrency(median)} marks the party's center-point of wealth declaration.&rdquo;
           </p>
        </div>
      </div>
    </div>
  );
}
