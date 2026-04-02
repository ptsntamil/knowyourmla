"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ShieldAlert, Gavel, UserX, AlertCircle } from "lucide-react";
import Link from "next/link";
import ProfileImage from "./ProfileImage";

interface PartyCriminalInsightsProps {
  data: any;
}

export default function PartyCriminalInsights({ data }: PartyCriminalInsightsProps) {
  const { total, percentage, max, highestCandidate, highestCandidateId, highestCandidatePic } = data;

  const summaryData = [
    { name: "With Cases", value: total, color: "#EF4444" },
    { name: "Clean Record", value: data.totalCandidates - total, color: "#10B981" }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Criminal Case Insights</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal background analytics</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-8 bg-rose-50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20">
                 <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total with Cases</p>
                 <p className="text-5xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">{total}</p>
                 <p className="text-xs font-bold text-rose-400/80 mt-2">{percentage}% of candidates</p>
              </div>
              <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/20">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Max cases (Individual)</p>
                 <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{max}</p>
                 <p className="text-xs font-bold text-emerald-400/80 mt-2">Highest single declaration</p>
              </div>
           </div>

           <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-4">
                 <Gavel className="text-slate-400" size={20} />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Load Summary</p>
              </div>
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                 <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${percentage}%` }} 
                 />
                 <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${100 - parseFloat(percentage)}%` }} 
                 />
              </div>
              <div className="flex justify-between mt-3 px-2">
                 <span className="text-[10px] font-black text-rose-500 uppercase">{total} Candidates with Cases</span>
                 <span className="text-[10px] font-black text-emerald-500 uppercase">NO Criminal Record</span>
              </div>
           </div>
        </div>

        <div className="bg-brand-dark dark:bg-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-6">
           <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Highest Criminal Cases</p>
           {highestCandidateId ? (
              <>
                 <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-brand-gold shadow-2xl">
                    <ProfileImage src={highestCandidatePic} alt={highestCandidate} />
                 </div>
                 <div>
                    <Link href={`/tn/mla/${highestCandidateId}`} className="text-lg font-black text-white hover:text-brand-gold transition-colors">
                        {highestCandidate}
                    </Link>
                    <p className="text-brand-gold font-black mt-1 text-2xl">{max} Cases</p>
                 </div>
              </>
           ) : (
              <>
                 <div className="w-24 h-24 rounded-3xl bg-slate-700 flex items-center justify-center">
                    <UserX className="text-slate-500" size={40} />
                 </div>
                 <p className="text-slate-400 font-black">No cases declared</p>
              </>
           )}
        </div>
      </div>
      
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-l-4 border-rose-500">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-rose-500 shrink-0 mt-1" size={20} />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
            &ldquo;Public record check: {percentage}% of the party's candidates for this selection have declared criminal cases in their affidavits. Transparency note: Declared cases may include political protests and are not necessarily convictions.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
