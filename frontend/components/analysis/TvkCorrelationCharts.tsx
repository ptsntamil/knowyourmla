"use client";

import React, { useMemo } from 'react';
import { TvkAnalysisData } from '@/lib/services/tvk-analysis.service';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

interface Props {
  data: TvkAnalysisData;
}

export default function TvkCorrelationCharts({ data }: Props) {
  
  const scatterData = useMemo(() => {
    return data.constituencies.map(c => ({
      x: c.tvk_vote_share,
      y: c.vote_growth_percentage,
      z: c.votes_added,
      name: c.name,
      winner: c.winner_party
    }));
  }, [data]);

  const top20Tvk = useMemo(() => {
    return [...data.constituencies]
      .sort((a, b) => b.tvk_vote_share - a.tvk_vote_share)
      .slice(0, 20)
      .map(c => ({
        name: c.name,
        tvkShare: c.tvk_vote_share
      }));
  }, [data]);

  const top20Growth = useMemo(() => {
    return [...data.constituencies]
      .sort((a, b) => b.vote_growth_percentage - a.vote_growth_percentage)
      .slice(0, 20)
      .map(c => ({
        name: c.name,
        growth: c.vote_growth_percentage
      }));
  }, [data]);

  return (
    <div className="space-y-16">
      
      {/* Scatter Plot */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">TVK Vote Share vs Vote Growth</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">X-Axis: TVK Vote Share (%) | Y-Axis: Total Vote Growth 2021-2026 (%)</p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="TVK Share" 
                unit="%" 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
                domain={[0, 'auto']} 
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Vote Growth" 
                unit="%" 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
                domain={['auto', 'auto']} 
              />
              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Votes Added" />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any, name: any) => {
                  if (name === "TVK Share") return `${Number(value).toFixed(2)}%`;
                  if (name === "Vote Growth") return `${Number(value).toFixed(2)}%`;
                  if (name === "Votes Added") return Number(value).toLocaleString();
                  return value;
                }} 
                labelFormatter={(val, items) => {
                  const payload = items[0]?.payload;
                  return payload ? `${payload.name} (${payload.winner})` : '';
                }} 
              />
              <Scatter name="Constituencies" data={scatterData} fill="#f59e0b" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 20 Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 20 by TVK Vote Share %</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top20Tvk} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => `${Number(val).toFixed(2)}%`} />
                <Bar dataKey="tvkShare" name="TVK Vote Share" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 20 by Vote Growth %</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top20Growth} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => `${Number(val).toFixed(2)}%`} />
                <Bar dataKey="growth" name="Vote Growth" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quadrant Analysis Boxes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Quadrant Categorization</h3>
        <p className="text-xs text-slate-500 font-medium mb-6">Based on state medians for TVK Share and Vote Growth</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-green-800 flex items-center justify-between mb-3">
              High TVK / High Growth
              <span className="bg-green-200 text-green-900 text-xs px-2 py-1 rounded-full">{data.metrics.quadrants.high_tvk_high_growth.length}</span>
            </h4>
            <div className="text-sm text-green-700 h-40 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1">
                {data.metrics.quadrants.high_tvk_high_growth.map(c => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span> <span className="opacity-75">({c.tvk_vote_share}%, {c.vote_growth_percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 flex items-center justify-between mb-3">
              High TVK / Low Growth
              <span className="bg-blue-200 text-blue-900 text-xs px-2 py-1 rounded-full">{data.metrics.quadrants.high_tvk_low_growth.length}</span>
            </h4>
            <div className="text-sm text-blue-700 h-40 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1">
                {data.metrics.quadrants.high_tvk_low_growth.map(c => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span> <span className="opacity-75">({c.tvk_vote_share}%, {c.vote_growth_percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
            <h4 className="font-bold text-orange-800 flex items-center justify-between mb-3">
              Low TVK / High Growth
              <span className="bg-orange-200 text-orange-900 text-xs px-2 py-1 rounded-full">{data.metrics.quadrants.low_tvk_high_growth.length}</span>
            </h4>
            <div className="text-sm text-orange-700 h-40 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1">
                {data.metrics.quadrants.low_tvk_high_growth.map(c => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span> <span className="opacity-75">({c.tvk_vote_share}%, {c.vote_growth_percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-gray-800 flex items-center justify-between mb-3">
              Low TVK / Low Growth
              <span className="bg-gray-200 text-gray-900 text-xs px-2 py-1 rounded-full">{data.metrics.quadrants.low_tvk_low_growth.length}</span>
            </h4>
            <div className="text-sm text-gray-600 h-40 overflow-y-auto">
              <ul className="list-disc pl-4 space-y-1">
                {data.metrics.quadrants.low_tvk_low_growth.map(c => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span> <span className="opacity-75">({c.tvk_vote_share}%, {c.vote_growth_percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
