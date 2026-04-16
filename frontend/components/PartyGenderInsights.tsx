"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Venus, Mars } from "lucide-react";
import { useState, useEffect } from "react";

interface PartyGenderInsightsProps {
  data: any;
}

export default function PartyGenderInsights({ data }: PartyGenderInsightsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { male, female, femalePercentage } = data;

  const chartData = [
    { name: "Female", value: female, color: "#DB2777" },
    { name: "Male", value: male, color: "#2563EB" }
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-border/50 shadow-sm space-y-8 sm:space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-3 sm:p-4 bg-pink-100 dark:bg-pink-900/20 text-pink-600 rounded-2xl shrink-0">
          <Venus size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Gender Diversity</h3>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate representation profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="h-[220px] sm:h-[250px] w-full relative">
          {isMounted && (
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
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-brand-dark dark:text-slate-200 leading-none">{femalePercentage}%</span>
            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Women</span>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
           <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/20">
              <div className="p-2 sm:p-3 bg-blue-500 text-white rounded-xl shrink-0">
                 <Mars size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Male Candidates</p>
                 <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">{male}</p>
              </div>
           </div>

           <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-pink-50 dark:bg-pink-900/10 rounded-2xl sm:rounded-3xl border border-pink-100 dark:border-pink-900/20">
              <div className="p-2 sm:p-3 bg-pink-500 text-white rounded-xl shrink-0">
                 <Venus size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] sm:text-[10px] font-black text-pink-400 uppercase tracking-widest mb-0.5">Female Candidates</p>
                 <p className="text-2xl sm:text-3xl font-black text-pink-600 dark:text-pink-400 leading-none">{female}</p>
              </div>
           </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border/50">
        <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
          &ldquo;Representation analysis: Within this context, {femalePercentage}% of candidates are female. Gender diversity metrics reflect the party&apos;s democratic outreach efforts.&rdquo;
        </p>
      </div>
    </div>
  );
}
