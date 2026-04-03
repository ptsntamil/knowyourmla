"use client";

import { useState } from "react";
import { Search, SortAsc, TrendingUp, Users } from "lucide-react";
import PartyCard from "./PartyCard";

interface PartyFiltersProps {
  initialParties: any[];
}

export default function PartyFilters({ initialParties }: PartyFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  const priorityParties = ["DMK", "AIADMK", "ADMK", "INC", "BJP", "PMK", "NTK", "VCK", "CPI", "CPIM", "MDMK", "MNM", "TVK"];

  const filteredParties = initialParties
    .filter(p => (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.short_name || "").toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "priority") {
        const indexA = priorityParties.indexOf(a.short_name || "");
        const indexB = priorityParties.indexOf(b.short_name || "");

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by party name or symbol..."
            className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-gold/20 transition-all text-sm font-black uppercase tracking-tight text-brand-dark"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
            <SortAsc size={18} />
            <select
              className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="priority">Recommended</option>
              <option value="name">Alphabetical</option>
              <option value="candidates">Most Candidates</option>
              <option value="wins">Most Wins</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredParties.map((party) => (
          <PartyCard key={party.PK} party={party} />
        ))}
      </div>

      {filteredParties.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No parties found matching your search</p>
        </div>
      )}
    </div>
  );
}
