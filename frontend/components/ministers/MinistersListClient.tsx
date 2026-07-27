"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { MinisterItem } from "@/types/models";
import Badge from "@/components/ui/Badge";
import MinistersTable from "./MinistersTable";

interface MinistersListClientProps {
  initialMinisters: MinisterItem[];
}

export default function MinistersListClient({ initialMinisters }: MinistersListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState("All Portfolios");
  const [selectedMinistry, setSelectedMinistry] = useState("All Ministries");

  // Extract all unique portfolios
  const allPortfolios = useMemo(() => {
    const portfolios = new Set<string>();
    initialMinisters.forEach(m => {
      m.portfolios.forEach(p => portfolios.add(p));
    });
    return ["All Portfolios", ...Array.from(portfolios).sort()];
  }, [initialMinisters]);

  // Extract all unique ministries (designations)
  const allMinistries = useMemo(() => {
    const ministries = new Set<string>();
    initialMinisters.forEach(m => {
      if (m.designation) {
        ministries.add(m.designation);
      }
    });
    return ["All Ministries", ...Array.from(ministries).sort()];
  }, [initialMinisters]);

  const filteredMinisters = useMemo(() => {
    return initialMinisters.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.constituency || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.portfolios.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPortfolio = selectedPortfolio === "All Portfolios" || m.portfolios.includes(selectedPortfolio);
      const matchesMinistry = selectedMinistry === "All Ministries" || m.designation === selectedMinistry;

      return matchesSearch && matchesPortfolio && matchesMinistry;
    });
  }, [initialMinisters, searchQuery, selectedPortfolio, selectedMinistry]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedPortfolio("All Portfolios");
    setSelectedMinistry("All Ministries");
  };

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 mb-12 border border-slate-100 flex flex-col md:flex-row gap-4 items-stretch relative z-20">
        
        {/* Text Search */}
        <div className="flex-1 min-w-[280px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
            Search Ministers
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, portfolio or constituency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-4 pr-10 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-brand-dark placeholder:text-slate-400 focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-dark"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Portfolio Filter */}
        <div className="flex-1 md:max-w-xs">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
            Filter by Portfolio
          </label>
          <select
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-brand-dark focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.2em'
            }}
          >
            {allPortfolios.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Ministry Filter */}
        <div className="flex-1 md:max-w-xs">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
            Filter by Ministry
          </label>
          <select
            value={selectedMinistry}
            onChange={(e) => setSelectedMinistry(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-brand-dark focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/10 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.2em'
            }}
          >
            {allMinistries.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" size="sm" dot className="border-none bg-transparent lowercase tracking-normal">
          Showing <span className="text-brand-dark mx-1 font-black">{filteredMinisters.length}</span> of {initialMinisters.length} Ministers
        </Badge>
        
        {(searchQuery || selectedPortfolio !== "All Portfolios" || selectedMinistry !== "All Ministries") && (
          <button
            onClick={handleReset}
            className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:text-brand-dark transition-colors flex items-center gap-2 group"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform" /> Reset Filters
          </button>
        )}
      </div>

      <MinistersTable
        ministers={filteredMinisters}
        searchQuery={searchQuery}
        selectedPortfolio={selectedPortfolio}
        selectedMinistry={selectedMinistry}
        onReset={handleReset}
      />
    </>
  );
}
