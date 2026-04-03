"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, X } from "lucide-react";
import { MLAListItem } from "@/types/models";

interface MLAListClientProps {
  initialMLAs: MLAListItem[];
}

export default function MLAListClient({ initialMLAs }: MLAListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("All Parties");

  const parties = useMemo(() => {
    const uniqueParties = Array.from(new Set(initialMLAs.map((mla) => mla.party)));
    return ["All Parties", ...uniqueParties.sort()];
  }, [initialMLAs]);

  const filteredMLAs = useMemo(() => {
    return initialMLAs.filter((mla) => {
      const matchesSearch = 
        mla.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mla.constituency.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesParty = selectedParty === "All Parties" || mla.party === selectedParty;
      
      return matchesSearch && matchesParty;
    });
  }, [initialMLAs, searchQuery, selectedParty]);

  return (
    <>
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

      <div className="flex justify-between items-center mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
            Showing <span className="text-brand-dark">{filteredMLAs.length}</span> of {initialMLAs.length} MLAs
        </p>
        {(searchQuery || selectedParty !== "All Parties") && (
          <button 
            onClick={() => {setSearchQuery(""); setSelectedParty("All Parties");}}
            className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:text-brand-dark transition-colors flex items-center gap-2 group"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform" /> Reset Filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Constituency</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MLA Name</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Party</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMLAs.length > 0 ? (
                filteredMLAs.map((mla) => (
                  <tr key={mla.constituency_id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <Link 
                        href={`/tn/constituency/${mla.constituency_id.replace("CONSTITUENCY#", "")}`}
                        className="text-sm font-bold text-brand-dark hover:text-brand-gold transition-colors inline-flex items-center group/link"
                      >
                        {mla.constituency}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 group-hover/link:translate-x-1 transition-all" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      {mla.person_id ? (
                        <Link 
                          href={`/tn/mla/${mla.person_id.replace("PERSON#", "")}`}
                          className="text-sm font-black text-slate-800 hover:text-brand-gold transition-colors block"
                        >
                          {mla.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-slate-300 italic">Not Available</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span 
                        className="text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-3 w-fit shadow-sm border whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: mla.party_color_bg || '#f8fafc',
                          color: mla.party_color_text || '#1e293b',
                          borderColor: mla.party_color_border || '#e2e8f0'
                        }}
                      >
                        {mla.party_logo_url && (
                          <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                            <Image 
                              src={mla.party_logo_url} 
                              alt={mla.party} 
                              width={24}
                              height={24}
                              className="object-contain" 
                            />
                          </div>
                        )}
                        {mla.party}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-500 tabular-nums bg-slate-100/50 px-3 py-1 rounded-lg">
                        {mla.period}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="p-6 bg-slate-50 rounded-3xl mb-6 ring-1 ring-slate-100">
                        <Search className="text-slate-300 animate-pulse" size={48} />
                      </div>
                      <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-2">No MLAs matches your search</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        We couldn't find any results for "{searchQuery}" in {selectedParty === "All Parties" ? "all parties" : selectedParty}.
                      </p>
                      <button 
                        onClick={() => {setSearchQuery(""); setSelectedParty("All Parties");}}
                        className="mt-8 px-8 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-brand-gold transition-colors shadow-xl"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
