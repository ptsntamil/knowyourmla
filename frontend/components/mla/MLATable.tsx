"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { MLAListItem } from "@/types/models";
import { getPartySlug } from "@/lib/utils/party-utils";

interface MLATableProps {
  mlas: MLAListItem[];
  searchQuery: string;
  selectedParty: string;
  onReset: () => void;
}

export default function MLATable({ mlas, searchQuery, selectedParty, onReset }: MLATableProps) {
  if (mlas.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 py-24 text-center">
        <div className="flex flex-col items-center max-w-sm mx-auto">
          <div className="p-6 bg-slate-50 rounded-3xl mb-6 ring-1 ring-slate-100">
            <Search className="text-slate-300 animate-pulse" size={48} />
          </div>
          <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-2">No MLAs matches your search</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            We couldn't find any results for "{searchQuery}" in {selectedParty === "All Parties" ? "all parties" : selectedParty}.
          </p>
          <button
            onClick={onReset}
            className="mt-8 px-8 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-brand-gold transition-colors shadow-xl"
          >
            Clear all filters
          </button>
        </div>
      </div>
    );
  }

  return (
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
            {mlas.map((mla) => (
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
                  <Link
                    href={`/parties/${getPartySlug(mla.party)}`}
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
                  </Link>
                </td>
                <td className="px-8 py-5">
                  <span className="text-xs font-bold text-slate-500 tabular-nums bg-slate-100/50 px-3 py-1 rounded-lg dark:bg-slate-900/10 dark:text-slate-900">
                    {mla.period}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
