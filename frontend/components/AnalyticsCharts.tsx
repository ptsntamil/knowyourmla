"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface AssetChartProps {
  data: { year: number | string; assets: number; growth_percent: number | null }[];
}

export function AssetChart({ data }: AssetChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg" />;

  return (
    <div className="h-[300px] w-full" suppressHydrationWarning>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`}
          />
          <Tooltip
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={(value: any, name: any, props: any) => {
              const growth = props.payload.growth_percent;
              return [
                <div key="assets" className="flex flex-col">
                  <span className="font-black text-brand-dark">₹{Number(value).toLocaleString('en-IN')}</span>
                  {growth !== null && (
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}% Growth
                    </span>
                  )}
                </div>,
                "Assets"
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="assets"
            stroke="#CC8D1A"
            strokeWidth={4}
            dot={{ r: 6, fill: '#CC8D1A', strokeWidth: 3, stroke: '#fff' }}
            activeDot={{ r: 8, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface VoteTrendChartProps {
  data: { year: number | string; votes: number; vote_percent: number | null }[];
}

export function VoteTrendChart({ data }: VoteTrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg" />;

  return (
    <div className="h-[300px] w-full" suppressHydrationWarning>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: '#F1F5F9' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={(value: any, name: any, props: any) => {
              if (name === "votes") {
                const voteShare = props.payload.vote_percent;
                return [
                  <div key="votes" className="flex flex-col">
                    <span className="font-black text-brand-dark">{Number(value).toLocaleString('en-IN')} Votes</span>
                    {voteShare && <span className="text-[10px] text-brand-gold uppercase tracking-wider font-bold">{voteShare}% Vote share</span>}
                  </div>,
                  ""
                ];
              }
              return [value, name];
            }}
          />
          <Bar dataKey="votes" fill="#E3C75F" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#CC8D1A' : '#E3C75F'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MarginTrendChartProps {
  data: { year: number | string; margin: number; margin_percent: number | null }[];
}

export function MarginTrendChart({ data }: MarginTrendChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg" />;

  return (
    <div className="h-[300px] w-full" suppressHydrationWarning>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#164C45" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#164C45" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
            formatter={(value: any, name: any) => {
              if (name === "margin_percent") {
                return [`${value}%`, "Margin Strength"];
              }
              return [Number(value).toLocaleString('en-IN'), "Vote Margin"];
            }}
          />
          <Area
            type="monotone"
            dataKey="margin_percent"
            stroke="#164C45"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorMargin)"
            dot={{ r: 6, fill: '#164C45', strokeWidth: 3, stroke: '#fff' }}
            activeDot={{ r: 8, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
