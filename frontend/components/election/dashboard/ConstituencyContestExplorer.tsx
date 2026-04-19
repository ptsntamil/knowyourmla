"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ContestCard, DashboardFilterOptions } from '@/lib/elections/preElectionDashboard/dashboard.types';
import Link from 'next/link';
import PartyBadge from '@/components/ui/PartyBadge';
import { Search, MapPin, Users, History, ArrowRight, X, Filter, ChevronDown, LayoutGrid, Target, Zap } from 'lucide-react';

interface ConstituencyContestExplorerProps {
  contests: ContestCard[];
  filters?: DashboardFilterOptions;
}

export default function ConstituencyContestExplorer({ contests, filters }: ConstituencyContestExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 1. Filter State (Synced with URL)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || "");
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || "All");
  const [selectedPattern, setSelectedPattern] = useState(searchParams.get('pattern') || "All");

  // 2. Local UI State
  const [itemsToShow, setItemsToShow] = useState(18);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Pattern Options
  const patternOptions = ["All", "Open Seat", "Incumbent Recontest", "Multi-Corner", "Close Margin"];

  // 3. Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm) params.set('q', searchTerm);
    else params.delete('q');

    if (selectedDistrict !== "All") params.set('district', selectedDistrict);
    else params.delete('district');

    if (selectedPattern !== "All") params.set('pattern', selectedPattern);
    else params.delete('pattern');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchTerm, selectedDistrict, selectedPattern, pathname, router, searchParams]);

  // 4. Filtering Logic
  const filteredContests = useMemo(() => {
    return contests.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        c.constituencyName.toLowerCase().includes(searchLower) ||
        c.districtName?.toLowerCase().includes(searchLower);

      const matchesDistrict = selectedDistrict === "All" || c.districtId === selectedDistrict;

      const matchesPattern = selectedPattern === "All" ||
        (selectedPattern === "Open Seat" && c.tags.includes("Open Seat")) ||
        (selectedPattern === "Incumbent Recontest" && c.tags.includes("Incumbent Recontest")) ||
        (selectedPattern === "Multi-Corner" && c.tags.includes("Multi-Corner")) ||
        (selectedPattern === "Close Margin" && (typeof c.lastMargin === 'number' && c.lastMargin < 5000));

      return matchesSearch && matchesDistrict && matchesPattern;
    });
  }, [contests, searchTerm, selectedDistrict, selectedPattern]);

  // 5. Highlight Contests
  const topContests = useMemo(() => {
    return contests
      .filter(c => c.tags.includes("Open Seat") || (typeof c.lastMargin === 'number' && c.lastMargin < 3000))
      .sort((a, b) => (a.lastMargin || 999999) - (b.lastMargin || 999999))
      .slice(0, 6);
  }, [contests]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("All");
    setSelectedPattern("All");
  };

  const removeFilter = (type: 'q' | 'district' | 'pattern') => {
    if (type === 'q') setSearchTerm("");
    if (type === 'district') setSelectedDistrict("All");
    if (type === 'pattern') setSelectedPattern("All");
  };

  return (
    <div className="space-y-12">
      {/* Header & Main Controls */}
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
              <h1 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
                Constituency Explorer
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl">
              Real-time intelligence across Tamil Nadu's 234 assembly seats. Tracking candidates, incumbent defenses, and key electoral shifts for 2026.
            </p>
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="md:hidden flex items-center justify-center gap-2 bg-brand-dark text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Global Filters Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-6 items-end bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="col-span-4 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Search Seats</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search name or district..."
                className="w-full bg-slate-50 border border-transparent focus:border-brand-gold/20 focus:bg-white text-slate-700 text-sm font-bold rounded-2xl px-12 py-4 focus:outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-span-3 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">District</label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border border-transparent text-brand-dark text-sm font-bold rounded-2xl px-4 py-4 focus:outline-none focus:bg-white focus:border-brand-gold/20 appearance-none cursor-pointer"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="All">All Districts</option>
                {filters?.districts?.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="col-span-5 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Pattern Analysis</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-transparent">
              {patternOptions.map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => setSelectedPattern(pattern)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPattern === pattern
                    ? 'bg-white text-brand-dark shadow-md'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {pattern === "All" ? "All Areas" : pattern}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(searchTerm || selectedDistrict !== "All" || selectedPattern !== "All") && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Filters:</span>
          {searchTerm && (
            <button onClick={() => removeFilter('q')} className="inline-flex items-center gap-2 bg-brand-gold text-brand-dark px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">
              "{searchTerm}" <X size={12} />
            </button>
          )}
          {selectedDistrict !== "All" && (
            <button onClick={() => removeFilter('district')} className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">
              District: {filters?.districts?.find(d => d.value === selectedDistrict)?.label} <X size={12} />
            </button>
          )}
          {selectedPattern !== "All" && (
            <button onClick={() => removeFilter('pattern')} className="inline-flex items-center gap-2 bg-brand-dark text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all">
              {selectedPattern} <X size={12} />
            </button>
          )}
          <button onClick={clearFilters} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline ml-2">Reset All</button>
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {filteredContests.length} <span className="text-slate-400">Seats Found</span>
          </div>
          {selectedPattern !== "All" && (
            <span className="text-xs font-bold text-slate-400">Filtered by <span className="text-brand-dark">{selectedPattern}</span></span>
          )}
        </div>
      </div>

      {/* Top Contests - Key Highlight Layer */}
      {selectedDistrict === "All" && selectedPattern === "All" && !searchTerm && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Zap className="text-brand-gold fill-brand-gold" size={20} />
            <h2 className="text-sm font-black text-brand-dark uppercase tracking-widest">Key Contests to Watch</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topContests.map((contest, idx) => (
              <Link
                key={`top-${contest.constituencyId}`}
                href={`/tn/constituency/${contest.constituencyId}`}
                className="group relative bg-brand-dark rounded-3xl p-6 overflow-hidden border border-brand-dark/10 shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white uppercase italic">{contest.constituencyName}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{contest.districtName}</p>
                    </div>
                    <span className="text-[8px] font-black px-2 py-1 bg-brand-gold text-brand-dark rounded uppercase tracking-widest">High Stakes</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <span className="text-[9px] font-bold text-slate-300 uppercase">Prev. Margin</span>
                    <span className="text-xs font-black text-brand-gold">+{contest.lastMargin?.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredContests.slice(0, itemsToShow).map((contest, idx) => (
          <Link
            key={`${contest.constituencyId}-${idx}`}
            href={`/tn/constituency/${contest.constituencyId}`}
            className="group flex flex-col bg-white border border-slate-100 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10 flex flex-col h-full space-y-7">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight italic group-hover:text-brand-gold transition-colors block leading-none">
                    {contest.constituencyName}
                  </h3>
                  {/* Quick Indicators Row */}
                  <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><MapPin size={10} className="text-brand-gold" /> {contest.districtName}</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {contest.candidateCount} Cands</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                  {/* Limit to 3 tags */}
                  {contest.tags.slice(0, 3).map((t, idx) => (
                    <span key={`${t}-${idx}`} className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm whitespace-nowrap ${t === 'Close Margin' || t === 'Open Seat'
                        ? 'bg-rose-50 text-rose-500 border-rose-100'
                        : 'bg-brand-gold/10 text-brand-gold border-brand-gold/10'
                      }`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">2021 Winner</span>
                  </div>
                  {typeof contest.lastMargin === 'number' && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${contest.lastMargin < 5000 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                      }`}>
                      +{contest.lastMargin.toLocaleString()} Margin
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between px-1">
                  {contest.lastWinner ? (
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-700 text-sm leading-tight">{contest.lastWinner}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{contest.lastWinnerPartyShort}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">No historical data found</p>
                  )}
                  <PartyBadge 
                    party={contest.lastWinnerParty || "Independent"} 
                    shortName={contest.lastWinnerPartyShort}
                    showName={false} 
                    size="sm" 
                  />
                </div>
              </div>

              {/* 2026 Candidates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Contenders</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {contest.candidates.slice(0, 4).map((cand, idx) => (
                    <div key={`${cand.id}-${idx}`} title={cand.name}>
                      <PartyBadge
                        party={cand.partyName || "Independent"}
                        shortName={cand.partyShortName}
                        logoUrl={cand.partyLogoUrl}
                        showName={false}
                        size="sm"
                      />
                    </div>
                  ))}
                  {contest.candidateCount > 4 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                      +{contest.candidateCount - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination & Footer Sections */}
      <div className="space-y-20 pt-10">
        {filteredContests.length > itemsToShow && (
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={() => setItemsToShow(prev => prev + 18)}
              className="bg-brand-dark text-white font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] text-xs hover:bg-brand-gold hover:text-brand-dark transition-all active:scale-95 shadow-xl shadow-brand-dark/10"
            >
              Load More Constituencies
            </button>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Showing {itemsToShow} of {filteredContests.length} seats</p>
          </div>
        )}

        {/* Explore by District Link Layer */}
        <section className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight italic">Explore by District</h2>
              <p className="text-slate-500 font-medium text-xs">Drill down into constituency contests across all 38 districts of Tamil Nadu.</p>
            </div>
            <Link href="/tn" className="text-[10px] font-black text-brand-gold uppercase tracking-widest hover:underline flex items-center gap-2">
              View All Districts <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filters?.districts?.slice(0, 12).map(district => (
              <button
                key={district.value}
                onClick={() => setSelectedDistrict(district.value)}
                className="bg-white border border-slate-100 p-3 rounded-2xl text-[10px] font-bold text-slate-600 hover:border-brand-gold hover:text-brand-gold transition-all text-center truncate"
              >
                {district.label}
              </button>
            ))}
          </div>
        </section>

        {/* SEO Content Block */}
        <section className="max-w-4xl space-y-8">
          <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter italic">Tamil Nadu Constituency Contests 2026</h2>
          <div className="prose prose-slate prose-sm text-slate-500 font-medium max-w-none space-y-4">
            <p>
              The 2026 Tamil Nadu Legislative Assembly election is set to be one of the most dynamic in the state's political history. This constituency explorer provides a comprehensive portal into all 234 assembly seats, allowing voters and analysts to track candidates as they are announced by major alliances.
            </p>
            <p>
              Using our advanced pattern analysis, you can quickly identify <strong>Open Seats</strong> where an incumbent is not seeking re-election, <strong>Multi-Cornered Contests</strong> where three or more major parties have a significant presence, and <strong>Close Margin Seats</strong> from the 2021 election that are likely to be battlegrounds again.
            </p>
            <p>
              Each constituency profile includes historical results, current candidate lineups, and regional demographics to provide a complete picture of the electoral landscape. From the urban corridors of Chennai to the agrarian heartlands of the Delta region and the industrial belts of the West, explore how Tamil Nadu is preparing for its next legislative assembly.
            </p>
          </div>
        </section>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-brand-dark uppercase italic">Filters</h2>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Search</label>
                <input
                  type="text"
                  placeholder="Constituency name..."
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">District</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="All">All Districts</option>
                  {filters?.districts?.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Pattern</label>
                <div className="grid grid-cols-2 gap-2">
                  {patternOptions.map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setSelectedPattern(pattern)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedPattern === pattern
                        ? 'bg-brand-dark text-white'
                        : 'bg-slate-50 text-slate-400'
                        }`}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="w-full bg-brand-gold text-brand-dark font-black py-4 rounded-2xl uppercase tracking-widest text-xs"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
