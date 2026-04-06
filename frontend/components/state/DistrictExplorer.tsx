"use client";

import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import DistrictCard from '@/components/DistrictCard';
import { DistrictResponse } from '@/types/models';

interface DistrictExplorerProps {
  districts: DistrictResponse[];
  countMap: Record<string, number>;
}

type SortOption = 'name-asc' | 'name-desc' | 'const-desc' | 'const-asc';

export default function DistrictExplorer({ districts, countMap }: DistrictExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  const filteredAndSortedDistricts = useMemo(() => {
    return districts
      .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const countA = countMap[a.id] || 0;
        const countB = countMap[b.id] || 0;

        switch (sortBy) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'const-desc': return countB - countA;
          case 'const-asc': return countA - countB;
          default: return 0;
        }
      });
  }, [districts, searchQuery, sortBy, countMap]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Explore Districts of Tamil Nadu</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Browse all districts and discover their constituencies, current MLAs, and political landscape.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Search */}
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-gold transition-colors" />
            <input
              type="text"
              placeholder="Search district name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-12 pr-6 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
            />
          </div>

          {/* Sort */}
          <div className="relative group">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-brand-gold transition-colors" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-white border border-slate-200 rounded-full py-2.5 pl-12 pr-10 text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all cursor-pointer"
            >
              <option value="name-asc">A to Z</option>
              <option value="name-desc">Z to A</option>
              <option value="const-desc">Most Constituencies</option>
              <option value="const-asc">Least Constituencies</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-brand-gold transition-colors" />
          </div>
        </div>
      </div>

      {filteredAndSortedDistricts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAndSortedDistricts.map((district) => (
            <DistrictCard
              key={district.id}
              district={district}
              constituencyCount={countMap[district.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-20 flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
              <Search size={32} />
           </div>
           <div className="space-y-1">
             <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">No Districts Found</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Try adjusting your search query</p>
           </div>
           <button 
             onClick={() => setSearchQuery('')}
             className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity pt-4"
           >
             Clear All Filters
           </button>
        </div>
      )}
    </div>
  );
}
