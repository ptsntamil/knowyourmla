"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';

interface ElectionInsightsHeroProps {
  year: number;
  stateName: string;
}

export default function ElectionInsightsHero({ year, stateName }: ElectionInsightsHeroProps) {
  return (
    <div className="relative pt-32 pb-20 overflow-hidden">
      {/* Background purely for aesthetic */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-50 to-transparent -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Breadcrumb / Back Link */}
        <Link 
          href={`/tn/elections/${year}`}
          className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-brand-gold uppercase tracking-[0.2em] transition-colors transition-transform hover:-translate-x-1"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          Back to Election Summary
        </Link>

        {/* Title Group */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-dark rounded-2xl flex items-center justify-center shadow-lg shadow-brand-dark/20 text-white">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter leading-[0.9]">
              {stateName} {year} <br />
              <span className="text-brand-gold">Election Insights</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
            A deeper look into the victory margins, voter participation, and contestant demographics that shaped the {year} legislative assembly. Explore the facts behind the numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
