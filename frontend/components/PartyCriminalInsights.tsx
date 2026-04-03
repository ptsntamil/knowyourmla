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
    <div className="bg-bg-card rounded-[2.5rem] p-10 border border-border-subtle shadow-sm space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-bg-surface text-text-accent rounded-2xl shadow-lg shadow-black/20">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Criminal Case Insights</h3>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Legal background analytics</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-8 bg-bg-surface rounded-[2.5rem] border border-border-subtle">
                  <p className="text-[10px] font-black text-text-accent uppercase tracking-widest mb-1">Total with Cases</p>
                  <p className="text-5xl font-black text-text-accent tracking-tighter">{total}</p>
                  <p className="text-xs font-bold text-text-accent/80 mt-2">{percentage}% of candidates</p>
               </div>
               <div className="p-8 bg-bg-surface rounded-[2.5rem] border border-border-subtle">
                  <p className="text-[10px] font-black text-text-primary uppercase tracking-widest mb-1">Max cases (Individual)</p>
                  <p className="text-5xl font-black text-text-primary tracking-tighter">{max}</p>
                  <p className="text-xs font-bold text-text-primary/80 mt-2">Highest single declaration</p>
               </div>
            </div>

            <div className="p-8 bg-bg-page rounded-[2.5rem] border border-border-subtle">
               <div className="flex items-center gap-4 mb-4">
                  <Gavel className="text-text-muted" size={20} />
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Case Load Summary</p>
               </div>
               <div className="h-12 w-full bg-bg-surface rounded-full overflow-hidden flex">
                  <div 
                     className="h-full bg-text-accent transition-all duration-1000" 
                     style={{ width: `${percentage}%` }} 
                  />
                  <div 
                     className="h-full bg-bg-muted transition-all duration-1000" 
                     style={{ width: `${100 - parseFloat(percentage)}%` }} 
                  />
               </div>
               <div className="flex justify-between mt-3 px-2">
                  <span className="text-[10px] font-black text-text-accent uppercase">{total} Candidates with Cases</span>
                  <span className="text-[10px] font-black text-text-primary uppercase">NO Criminal Record</span>
               </div>
            </div>
        </div>

         <div className="bg-bg-surface rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-6">
            <p className="text-[10px] font-black text-text-accent uppercase tracking-widest">Highest Criminal Cases</p>
            {highestCandidateId ? (
               <>
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-border-accent shadow-2xl">
                     <ProfileImage src={highestCandidatePic} alt={highestCandidate} />
                  </div>
                  <div>
                     <Link href={`/tn/mla/${highestCandidateId}`} className="text-lg font-black text-text-primary hover:text-text-accent transition-colors">
                         {highestCandidate}
                     </Link>
                     <p className="text-text-accent font-black mt-1 text-2xl">{max} Cases</p>
                  </div>
               </>
            ) : (
               <>
                  <div className="w-24 h-24 rounded-3xl bg-bg-card flex items-center justify-center">
                     <UserX className="text-text-muted" size={40} />
                  </div>
                  <p className="text-text-muted font-black">No cases declared</p>
               </>
            )}
         </div>
      </div>
      
      <div className="p-6 bg-bg-page rounded-2xl border-l-4 border-text-accent">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-text-accent shrink-0 mt-1" size={20} />
          <p className="text-xs font-medium text-text-muted leading-relaxed italic">
            &ldquo;Public record check: {percentage}% of the party's candidates for this selection have declared criminal cases in their affidavits. Transparency note: Declared cases may include political protests and are not necessarily convictions.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
