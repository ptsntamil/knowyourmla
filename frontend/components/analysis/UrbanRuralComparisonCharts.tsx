"use client";

import React, { useMemo } from 'react';
import { UrbanRuralAnalysisData, ConstituencyAnalysisResult } from '@/lib/services/analysis.service';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

interface Props {
  data: UrbanRuralAnalysisData;
}

export default function UrbanRuralComparisonCharts({ data }: Props) {
  
  const groupBarData = [
    {
      name: "Total Votes Polled",
      Urban2021: data.urban.totalVotes2021,
      Urban2026: data.urban.totalVotes2026,
      SemiUrban2021: data.semiUrban.totalVotes2021,
      SemiUrban2026: data.semiUrban.totalVotes2026,
      Rural2021: data.rural.totalVotes2021,
      Rural2026: data.rural.totalVotes2026,
    }
  ];

  const avgGrowthData = [
    { name: "Urban", value: data.urban.averageGrowthPercentage, fill: "#2563eb" }, // blue-600
    { name: "Semi Urban", value: data.semiUrban.averageGrowthPercentage, fill: "#8b5cf6" }, // violet-500
    { name: "Rural", value: data.rural.averageGrowthPercentage, fill: "#10b981" }, // emerald-500
  ];

  const top20Urban = useMemo(() => {
    return [...data.urban.constituencies].sort((a, b) => b.votesAdded - a.votesAdded).slice(0, 20).map(c => ({
      name: c.constituencyName,
      votesAdded: c.votesAdded
    }));
  }, [data]);

  const top20SemiUrban = useMemo(() => {
    return [...data.semiUrban.constituencies].sort((a, b) => b.votesAdded - a.votesAdded).slice(0, 20).map(c => ({
      name: c.constituencyName,
      votesAdded: c.votesAdded
    }));
  }, [data]);

  const top20Rural = useMemo(() => {
    return [...data.rural.constituencies].sort((a, b) => b.votesAdded - a.votesAdded).slice(0, 20).map(c => ({
      name: c.constituencyName,
      votesAdded: c.votesAdded
    }));
  }, [data]);

  const districtComparisonData = useMemo(() => {
    return data.districtComparisons
      .map(d => ({
        name: d.districtId.replace('DISTRICT#', '').toUpperCase(),
        urbanGrowth: d.urbanGrowth,
        semiUrbanGrowth: d.semiUrbanGrowth,
        ruralGrowth: d.ruralGrowth
      }))
      .sort((a, b) => b.urbanGrowth - a.urbanGrowth)
      .slice(0, 15);
  }, [data]);

  const distributionData = useMemo(() => {
    return data.allConstituencies.map(c => ({
      x: c.growthPercentage,
      y: c.category === "Urban" ? 1 : c.category === "Semi Urban" ? 2 : 3,
      z: c.votesAdded,
      name: c.constituencyName,
      category: c.category
    }));
  }, [data]);

  return (
    <div className="space-y-16">
      
      {/* Top Level Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Grouped Bar Chart: Urban vs Rural 2021-2026 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Urban vs Rural: Votes Polled (2021 vs 2026)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => Number(val).toLocaleString()} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
                <Bar dataKey="Urban2021" name="Urban '21" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Urban2026" name="Urban '26" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SemiUrban2021" name="Semi-Urban '21" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SemiUrban2026" name="Semi-Urban '26" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rural2021" name="Rural '21" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rural2026" name="Rural '26" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Growth Percentage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Average Vote Growth %</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `${val.toFixed(1)}%`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => `${Number(val).toFixed(2)}%`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {avgGrowthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 20 Constituencies Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 20 Urban by Votes Added</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top20Urban} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => Number(val).toLocaleString()} />
                <Bar dataKey="votesAdded" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 20 Rural by Votes Added</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top20Rural} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => Number(val).toLocaleString()} />
                <Bar dataKey="votesAdded" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 20 Semi-Urban by Votes Added</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top20SemiUrban} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => Number(val).toLocaleString()} />
                <Bar dataKey="votesAdded" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* District Comparison & Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">District Comparison</h3>
          <p className="text-xs text-slate-500 font-medium mb-6">Urban vs Rural Vote Growth % by District</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val}%`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => `${Number(val).toFixed(2)}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                <Bar dataKey="urbanGrowth" name="Urban Growth" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="semiUrbanGrowth" name="Semi-Urban Growth" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ruralGrowth" name="Rural Growth" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Growth Distribution</h3>
          <p className="text-xs text-slate-500 font-medium mb-6">Vote Growth % spread across all constituencies</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="x" name="Growth" unit="%" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="y" name="Category" tickFormatter={(v) => v === 1 ? 'Urban' : v === 2 ? 'Semi' : 'Rural'} tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} domain={[0, 4]} ticks={[1, 2, 3]} />
                <ZAxis type="number" dataKey="z" range={[20, 400]} name="Votes Added" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: any, name: any, props: any) => {
                  if (name === "Growth") return `${Number(value).toFixed(2)}%`;
                  if (name === "Category") return props.payload.category;
                  return value;
                }} labelFormatter={(val, items) => items[0]?.payload?.name || ''} />
                <Scatter name="Constituencies" data={distributionData} fill="#3b82f6" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
