"use client";

import { VoterTrendConstituency } from "@/lib/services/voter-trend.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TrendChartsProps {
  topAddedVotes: VoterTrendConstituency[];
  topVoteGrowth: VoterTrendConstituency[];
  votesGrowthBuckets: { name: string; count: number }[];
}

export function TrendCharts({ topAddedVotes, topVoteGrowth, votesGrowthBuckets }: TrendChartsProps) {
  // Format for BarChart
  const addedVotesData = topAddedVotes.map(c => ({
    name: c.name,
    change: c.additional_votes
  }));

  const growthData = topVoteGrowth.map(c => ({
    name: c.name,
    change: c.vote_growth_percentage
  }));

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Votes Added Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Top 20 Constituencies by Votes Added</h3>
          {addedVotesData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={addedVotesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                  <Tooltip 
                    formatter={(value: any) => [`+${Number(value).toLocaleString('en-IN')}`, 'Votes Added']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="change" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No data available.
            </div>
          )}
        </div>

        {/* Top Vote Growth % Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Top 20 Constituencies by Vote Growth %</h3>
          {growthData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                  <Tooltip 
                    formatter={(value: any) => [`+${value}%`, 'Growth']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="change" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500 text-center px-4">
              <p>No data available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Histogram */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2">Votes Growth Distribution</h3>
        <p className="text-sm text-gray-500 mb-6">Number of constituencies falling into each vote growth percentage bucket.</p>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={votesGrowthBuckets} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} angle={-45} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [value, 'Constituencies']}
              />
              <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
