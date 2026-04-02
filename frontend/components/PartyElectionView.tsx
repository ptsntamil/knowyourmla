"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchPartyCandidates } from "@/services/api";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import CandidateMiniCard from "./CandidateMiniCard";

interface PartyElectionViewProps {
  partySlug: string;
  initialYear: number;
  years: number[];
  isGlobalFilter?: boolean;
}

type SortOption = "name" | "assets-desc" | "cases-desc" | "youngest";

export default function PartyElectionView({ partySlug, initialYear, years, isGlobalFilter }: PartyElectionViewProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "winner" | "contestant">("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [displayCount, setDisplayCount] = useState(15);

  useEffect(() => {
    setSelectedYear(initialYear);
  }, [initialYear]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchPartyCandidates(partySlug, selectedYear);
        setCandidates(data);
        setDisplayCount(15);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [partySlug, selectedYear]);

  const filteredAndSortedCandidates = useMemo(() => {
    let result = candidates.filter(c => {
      const matchesSearch = (c.candidate_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (c.constituency_id || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (resultFilter === "winner") return matchesSearch && c.is_winner;
      if (resultFilter === "contestant") return matchesSearch && !c.is_winner;
      return matchesSearch;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "assets-desc":
          return (b.total_assets || 0) - (a.total_assets || 0);
        case "cases-desc":
          return (b.criminal_cases || 0) - (a.criminal_cases || 0);
        case "youngest":
          return (a.age || 100) - (b.age || 100);
        default:
          return (a.candidate_name || "").localeCompare(b.candidate_name || "");
      }
    });

    return result;
  }, [candidates, searchTerm, resultFilter, sortBy]);

  const displayedCandidates = filteredAndSortedCandidates.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedCandidates.length;

  return (
    <div id="candidates" className="space-y-10 sm:space-y-16">
      <div className="space-y-2">
        <h2 className="text-3xl sm:text-5xl font-black text-brand-dark dark:text-slate-100 uppercase tracking-tighter">Candidate Directory</h2>
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            Exploring {filteredAndSortedCandidates.length} profiles from the {selectedYear} election
        </p>
      </div>

      <div className="space-y-6">
        <div className="sticky top-20 z-20 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex flex-col lg:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Search name or constituency..."
                    className="w-full pl-11 pr-5 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-border/50 focus:ring-2 focus:ring-brand-gold/20 outline-none text-xs font-bold uppercase tracking-wider"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             <div className="flex gap-3 overflow-x-auto no-scrollbar">
                <div className="relative group min-w-[140px]">
                    <select 
                        className="w-full bg-white dark:bg-slate-800 border border-border/50 rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                        value={resultFilter}
                        onChange={(e) => setResultFilter(e.target.value as any)}
                    >
                        <option value="all">All Results</option>
                        <option value="winner">🏆 Winners</option>
                        <option value="contestant">🗳️ Others</option>
                    </select>
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={12} />
                </div>

                <div className="relative group min-w-[160px]">
                    <select 
                        className="w-full bg-white dark:bg-slate-800 border border-border/50 rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="assets-desc">💰 Highest Assets</option>
                        <option value="cases-desc">⚖️ Most Cases</option>
                        <option value="youngest">👶 Youngest</option>
                    </select>
                    <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={12} />
                </div>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedCandidates.map((c) => (
              <CandidateMiniCard key={c.PK} c={c} />
            ))}

            {filteredAndSortedCandidates.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                 <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">No matching candidates found</p>
                 <button onClick={() => { setSearchTerm(""); setResultFilter("all"); setSortBy("name"); }} className="text-brand-gold font-black text-xs uppercase tracking-[0.2em] underline underline-offset-8">Reset View</button>
              </div>
            )}
          </div>
        )}

        {hasMore && !loading && (
          <div className="pt-12 text-center">
            <button 
              onClick={() => setDisplayCount(prev => prev + 15)}
              className="px-12 py-4 bg-brand-dark dark:bg-slate-800 text-white dark:text-brand-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl"
            >
              Load More Profiles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
