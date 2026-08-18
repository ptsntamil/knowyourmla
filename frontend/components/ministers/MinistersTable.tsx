"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { MinisterItem } from "@/types/models";


interface MinistersTableProps {
  ministers: MinisterItem[];
  searchQuery: string;
  selectedPortfolio: string;
  selectedMinistry: string;
  onReset: () => void;
}

export default function MinistersTable({ ministers, searchQuery, selectedPortfolio, selectedMinistry, onReset }: MinistersTableProps) {
  if (ministers.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 py-24 text-center">
        <div className="flex flex-col items-center max-w-sm mx-auto">
          <div className="p-6 bg-slate-50 rounded-3xl mb-6 ring-1 ring-slate-100">
            <Search className="text-slate-300 animate-pulse" size={48} />
          </div>
          <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter mb-2">No Ministers matched your search</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            We couldn't find any results for "{searchQuery}" in {selectedPortfolio === "All Portfolios" ? "all portfolios" : selectedPortfolio} 
            {selectedMinistry !== "All Ministries" ? ` under ${selectedMinistry}` : ""}.
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
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Minister</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/3">Portfolios</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Constituency</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">District In-charge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ministers.map((minister) => (
              <tr key={minister.candidate_id || minister.person_id || minister.name} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-8 py-6 align-top">
                  <div className="flex items-center gap-4">
                    {minister.profile_pic ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 shadow-inner flex-shrink-0">
                        <img 
                          src={minister.profile_pic} 
                          alt={minister.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center shadow-inner">
                        <span className="text-slate-400 font-bold text-xs uppercase">
                          {minister.name.substring(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      {minister.candidate_id && !minister.candidate_id.startsWith("AFFIDAVIT#UNKNOWN") ? (
                        <Link
                          href={`/tn/mla/${minister.candidate_id.replace("AFFIDAVIT#", "")}`}
                          className="text-sm font-black text-slate-800 hover:text-brand-gold transition-colors block"
                        >
                          {minister.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-black text-slate-800 block">
                          {minister.name}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 block mt-0.5">
                        {minister.designation}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {minister.portfolios.map((p, idx) => (
                      <span key={idx} className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md leading-tight">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-6 align-top">
                  {minister.constituency ? (
                    <Link
                      href={`/tn/constituency/${minister.constituency_id?.replace("CONSTITUENCY#", "")}`}
                      className="text-sm font-bold text-brand-dark hover:text-brand-gold transition-colors inline-flex items-center group/link"
                    >
                      {minister.constituency}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 group-hover/link:translate-x-1 transition-all" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-slate-300 italic">N/A</span>
                  )}
                </td>
                <td className="px-8 py-6 align-top">
                  {minister.representative_districts && minister.representative_districts.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {minister.representative_districts.map((dist, idx) => (
                        <Link
                          key={idx}
                          href={`/tn/districts/${dist.slug}`}
                          className="text-sm font-bold text-brand-dark hover:text-brand-gold transition-colors inline-flex items-center group/link"
                        >
                          {dist.name}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 group-hover/link:translate-x-1 transition-all" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-300 italic">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
