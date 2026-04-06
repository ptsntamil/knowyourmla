"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface DistributionData {
  label: string;
  value: number;
}

interface CompositionInsightsProps {
  distributions: {
    party: DistributionData[];
    education: DistributionData[];
    gender: DistributionData[];
    age: DistributionData[];
  };
}

const COLORS = ['#164C45', '#D4AF37', '#1e293b', '#64748B', '#94a3b8', '#cbd5e1'];
const GENDER_COLORS: Record<string, string> = {
  'Male': '#164C45',
  'Female': '#db2777',
  'Other/Unknown': '#94a3b8'
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-3xl border-none shadow-2xl">
        <p className="text-xs font-black text-brand-dark uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black text-brand-dark flex items-center gap-2">
          {payload[0].name} : <span className="text-brand-gold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function CompositionInsights({ distributions }: CompositionInsightsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-[3rem]" />;
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Party Distribution */}
      <ChartCard title="Party-wise Seat Share" subtitle="Distribution of seats across political parties">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributions.party.slice(0, 8)} layout="vertical" margin={{ left: 40, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="label" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="value" name="Seats" radius={[0, 4, 4, 0]}>
              {distributions.party.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Education Distribution */}
      <ChartCard title="Education Profile" subtitle="Academic background of the current assembly">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributions.education} margin={{ top: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 9, fontWeight: 700 }}
              angle={-25}
              textAnchor="end"
              height={50}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="MLAs" fill="#164C45" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Gender Distribution */}
      <ChartCard title="Gender Representation" subtitle="Visualizing assembly gender mix">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distributions.gender}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="label"
            >
              {distributions.gender.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.label] || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Age Distribution */}
      <ChartCard title="Age Demographics" subtitle="Age groups of current state legislators">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distributions.age}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="MLAs" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}


function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6">
      <div className="space-y-1">
        <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="h-[250px] w-full">
        {children}
      </div>
    </div>
  );
}
