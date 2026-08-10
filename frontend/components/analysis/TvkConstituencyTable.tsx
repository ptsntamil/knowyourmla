"use client";

import React, { useState } from 'react';
import { TvkAnalysisData, TvkConstituencyData } from '@/lib/services/tvk-analysis.service';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  data: TvkAnalysisData;
}

type SortField = keyof TvkConstituencyData;

export default function TvkConstituencyTable({ data }: Props) {
  const [sortField, setSortField] = useState<SortField>('tvk_vote_share');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFiltered = data.constituencies
    .filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.district_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return 0;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 inline" />
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Constituency Raw Data</h3>
          <p className="text-sm text-gray-500 mt-1">Complete dataset of all 234 constituencies</p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search constituency or district..."
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                Constituency <SortIcon field="name" />
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-gray-100" onClick={() => handleSort('district_name')}>
                District <SortIcon field="district_name" />
              </th>
              <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('tvk_vote_share')}>
                TVK Share % <SortIcon field="tvk_vote_share" />
              </th>
              <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('tvk_votes')}>
                TVK Votes <SortIcon field="tvk_votes" />
              </th>
              <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('vote_growth_percentage')}>
                Growth % <SortIcon field="vote_growth_percentage" />
              </th>
              <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('votes_added')}>
                Votes Added <SortIcon field="votes_added" />
              </th>
              <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('votes_2026')}>
                Total 2026 <SortIcon field="votes_2026" />
              </th>
              <th className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('winner_party')}>
                Winner <SortIcon field="winner_party" />
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {sortedAndFiltered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">
                  <Link href={`/tn/constituency/${c.slug}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-500">{c.district_name}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{c.tvk_vote_share.toFixed(2)}%</td>
                <td className="px-6 py-4 text-right text-gray-500">{c.tvk_votes.toLocaleString()}</td>
                <td className={`px-6 py-4 text-right font-medium ${c.vote_growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.vote_growth_percentage > 0 ? '+' : ''}{c.vote_growth_percentage.toFixed(2)}%
                </td>
                <td className={`px-6 py-4 text-right ${c.votes_added >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.votes_added > 0 ? '+' : ''}{c.votes_added.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-gray-500">{c.votes_2026.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                    {c.winner_party}
                  </span>
                </td>
              </tr>
            ))}
            {sortedAndFiltered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No constituencies found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
