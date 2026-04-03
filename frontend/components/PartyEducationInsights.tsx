"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { GraduationCap, Award, BookOpen } from "lucide-react";

interface PartyEducationInsightsProps {
  data: any;
}

const COLORS = [
  "#164C45", // Teal Green
  "#CC8D1A", // Mustard Gold
  "#E3C75F", // Soft Gold
  "#BDA523", // Olive Gold
  "#16232E"  // Deep Navy
];

export default function PartyEducationInsights({ data }: PartyEducationInsightsProps) {
  const { distribution, graduateCount, mostCommon, total } = data;

  const chartData = distribution.filter((d: any) => d.value > 0);

  return (
    <div className="bg-bg-card rounded-[2.5rem] p-6 sm:p-10 border border-border-subtle shadow-sm space-y-8 sm:space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-3 sm:p-4 bg-bg-surface text-text-accent rounded-2xl">
          <GraduationCap size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">Education Profile</h3>
          <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Academic background analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="h-[250px] sm:h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#16232E', borderRadius: '1rem', border: '1px solid #164C45', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-text-primary leading-none">{graduateCount}</span>
            <span className="text-[8px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest">Graduates+</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 sm:p-6 bg-bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle flex items-center gap-4 sm:gap-6">
             <div className="p-2 sm:p-3 bg-bg-accent/10 text-text-accent rounded-xl shrink-0">
                <Award size={20} className="sm:w-6 sm:h-6" />
             </div>
             <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Most Common Level</p>
                <p className="text-base sm:text-xl font-black text-text-primary uppercase truncate">{mostCommon}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
             <div className="p-4 sm:p-5 bg-card border border-border-subtle rounded-2xl">
                <p className="text-[8px] sm:text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Graduate %</p>
                <p className="text-base sm:text-lg font-black text-text-primary">
                    {((graduateCount / total) * 100).toFixed(1)}%
                </p>
             </div>
             <div className="p-4 sm:p-5 bg-card border border-border-subtle rounded-2xl">
                <p className="text-[8px] sm:text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Literacy</p>
                <p className="text-base sm:text-lg font-black text-text-primary">
                    {(((total - (distribution.find((d:any)=>d.name === "Illiterate")?.value || 0)) / total) * 100).toFixed(1)}%
                </p>
             </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {chartData.slice(0, 5).map((d: any, i: number) => (
              <div key={d.name} className="flex items-center gap-2 px-2.5 py-1 bg-bg-surface rounded-full border border-border-subtle">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[8px] sm:text-[9px] font-bold text-text-muted uppercase tracking-widest">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 bg-bg-surface rounded-2xl border border-white/5">
        <div className="flex items-start gap-3 sm:gap-4">
          <BookOpen className="text-text-accent shrink-0 mt-0.5" size={18} />
          <p className="text-[10px] sm:text-xs font-medium text-text-muted leading-relaxed italic">
            &ldquo;Analysis indicates that {((graduateCount / total) * 100).toFixed(1)}% of candidates hold a minimum of a Graduation degree. The profile is predominantly {mostCommon.toLowerCase()}-heavy.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
