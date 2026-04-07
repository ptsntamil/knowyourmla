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
} from "recharts";
import { PartySeatShare } from '@/lib/services/election-analytics.service';

interface SeatsByPartyChartProps {
  data: PartySeatShare[];
}

export default function SeatsByPartyChart({ data }: SeatsByPartyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-3xl" />;

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Seats by Party</h3>
          <p className="text-sm font-medium text-slate-400">Distribution of assembly seats won by each political party.</p>
        </div>
      </div>

      <div className="h-[400px] w-full" suppressHydrationWarning>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              dataKey="shortName"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#1E293B', fontSize: 12, fontWeight: 700 }}
              width={60}
            />
            <Tooltip
              cursor={{ fill: '#F1F5F9' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
              formatter={(value: any) => [value, "Seats"]}
            />
            <Bar dataKey="seatsWon" radius={[0, 4, 4, 0]} barSize={32}>
              {data.map((entry, index) => {
                const themeColors = ['#164C45', '#D4AF37', '#1E293B', '#64748B', '#94A3B8', '#CBD5E1'];
                const fill = themeColors[index % themeColors.length];
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={fill} 
                    stroke="transparent"
                    strokeWidth={1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
        {data.slice(0, 8).map((party, index) => {
          const themeColors = ['#164C45', '#D4AF37', '#1E293B', '#64748B', '#94A3B8', '#CBD5E1'];
          const color = themeColors[index % themeColors.length];
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full border shadow-sm" 
                  style={{ 
                    backgroundColor: color,
                    borderColor: 'rgba(0,0,0,0.05)'
                  }}
                />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{party.shortName}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-brand-dark">{party.seatsWon}</span>
                <span className="text-[10px] font-bold text-slate-400">{party.seatPercentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
