"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { VoteShareEntry } from '@/lib/analytics/transformVoteShareHistory';
import { formatIndianNumberCompact } from '@/lib/utils/formatIndianNumberCompact';
import { useState, useEffect } from 'react';

interface VoteShareTrendChartProps {
  data: VoteShareEntry[];
  selectedYear?: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">{label} Election</p>
        <div className="space-y-1.5 text-center">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Vote Share:</span>
            <span className="text-sm font-black text-brand-green">{data.voteShare}%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Votes:</span>
            <span className="text-sm font-black text-brand-dark dark:text-slate-200">
              {formatIndianNumberCompact(data.votes)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function VoteShareTrendChart({ data, selectedYear }: VoteShareTrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No chart data available</p>
      </div>
    );
  }

  // Pre-process data to add display properties
  const chartData = data.map(item => ({
    ...item,
    // If a year is selected, mute others. If no year is selected, all are active.
    isHighlighted: selectedYear ? item.year === selectedYear : true,
    opacity: selectedYear ? (item.year === selectedYear ? 1 : 0.3) : 1,
    strokeWidth: selectedYear ? (item.year === selectedYear ? 5 : 2) : 4,
    dotRadius: selectedYear ? (item.year === selectedYear ? 8 : 4) : 6,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Vote Share Trend</h3>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-pre-wrap">Historical percentage trend across elections</p>
        </div>
        {selectedYear && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
            <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Highlighting: {selectedYear}
            </span>
          </div>
        )}
      </div>

      <div className="h-[250px] sm:h-[300px] w-full">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                unit="%"
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="voteShare" 
                name="Vote Share" 
                stroke="#10b981" 
                strokeWidth={selectedYear ? 2 : 4} // Default base stroke
                dot={({ cx, cy, payload }) => (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={payload.dotRadius} 
                    fill={payload.isHighlighted ? "#10b981" : "#E2E8F0"} 
                    stroke="#fff" 
                    strokeWidth={2}
                    opacity={payload.opacity}
                  />
                )}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                animationDuration={1500}
              />
              {/* Overlay line for highlighting if year is selected */}
              {selectedYear && (
                 <Line 
                 type="monotone" 
                 dataKey="voteShare" 
                 stroke="#10b981" 
                 strokeWidth={5}
                 dot={false}
                 activeDot={false}
                 connectNulls
               />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
