"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Wallet, TrendingUp, Landmark, IndianRupee } from "lucide-react";
import { useState, useEffect } from "react";

interface PartyFinancialInsightsProps {
  data: any;
}

const COLORS = ["#10B981", "#059669", "#047857", "#164C45", "#064E3B", "#022C22"];

export default function PartyFinancialInsights({ data }: PartyFinancialInsightsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { average, median, crorepatiCount, crorepatiPercentage, distribution } = data;

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} Lacs`;
    return `₹${amt.toLocaleString()}`;
  };

  const chartData = distribution.filter((d: any) => d.value > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
          <Wallet size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Financial Insights</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset & Wealth analytics</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Assets</p>
                 <p className="text-xl font-black text-brand-dark dark:text-slate-200">{formatCurrency(average)}</p>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Median Assets</p>
                 <p className="text-xl font-black text-brand-dark dark:text-slate-200">{formatCurrency(median)}</p>
              </div>
           </div>

           <div className="p-8 bg-brand-dark dark:bg-emerald-900/10 rounded-[2.5rem] border border-brand-dark dark:border-emerald-900/20 text-white dark:text-emerald-400 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Crorepati Candidates</p>
                 <p className="text-5xl font-black">{crorepatiCount}</p>
                 <p className="text-xs font-bold opacity-60 mt-2">{crorepatiPercentage}% of total</p>
              </div>
              <Landmark size={64} className="opacity-10" />
           </div>
        </div>

        <div className="h-[300px] w-full relative">
           {isMounted && (
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
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {chartData.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
           )}
        </div>
      </div>
      
      <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-l-4 border-emerald-500">
        <div className="flex items-start gap-4">
           <IndianRupee className="text-emerald-500 shrink-0 mt-1" size={20} />
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
            &ldquo;Wealth profile analysis: The {crorepatiPercentage}% crorepati ratio indicates a {parseFloat(crorepatiPercentage) > 50 ? 'high-wealth' : 'middle-wealth'} candidate base. The median asset value of {formatCurrency(median)} marks the party's center-point of wealth declaration.&rdquo;
           </p>
        </div>
      </div>
    </div>
  );
}
