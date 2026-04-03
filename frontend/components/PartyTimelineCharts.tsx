"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface PartyTimelineChartsProps {
  analytics: any;
  isYearView?: boolean;
  selectedYear?: number | null;
}

export default function PartyTimelineCharts({ analytics, isYearView }: PartyTimelineChartsProps) {
  const { timeline } = analytics;

  // Chart data for Trends
  const trendData = timeline?.map((t: any) => ({
    ...t,
    winRate: parseFloat(((t.wins / (t.candidates || 1)) * 100).toFixed(1))
  })).sort((a: any, b: any) => a.year - b.year) || [];

  if (isYearView) {
      return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-border/50 backdrop-blur-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">{label} Election</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}:</span>
                <span className="text-xs font-black" style={{ color: entry.color }}>
                  {entry.value}{entry.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
        {/* Candidates vs Winners Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-border/50 shadow-sm space-y-6 sm:space-y-8">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Reach & Victories</h3>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Contestants vs Winners over years</p>
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} 
                />
                <Bar dataKey="candidates" name="Fielded" fill="#1e293b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wins" name="Won" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate & Diversity Line Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-border/50 shadow-sm space-y-6 sm:space-y-8">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Diversity & Success %</h3>
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Percentage trends across cycles</p>
          </div>
          
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  name="Win Rate" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  unit="%"
                />
                <Line 
                  type="monotone" 
                  dataKey="femalePercentage" 
                  name="Women %" 
                  stroke="#db2777" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  unit="%"
                />
                <Line 
                  type="monotone" 
                  dataKey="criminalPercentage" 
                  name="Criminal %" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  unit="%"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
