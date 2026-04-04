"use client";

import React from "react";
import { Search, Filter, X } from "lucide-react";

interface SearchFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedParty: string;
  setSelectedParty: (party: string) => void;
  parties: string[];
}

export default function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  selectedParty,
  setSelectedParty,
  parties,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative flex-1 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search by name or constituency..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all shadow-sm font-medium text-slate-700 placeholder:text-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="relative md:w-72 group">
        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-gold transition-colors" size={18} />
        <select
          className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold outline-none transition-all appearance-none shadow-sm cursor-pointer font-bold text-brand-dark uppercase text-[10px] tracking-widest"
          value={selectedParty}
          onChange={(e) => setSelectedParty(e.target.value)}
        >
          {parties.map((party) => (
            <option key={party} value={party} className="normal-case text-sm font-medium py-2">{party}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}
