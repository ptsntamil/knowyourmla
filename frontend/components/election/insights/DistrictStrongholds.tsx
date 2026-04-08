"use client";

import React from 'react';
import Link from 'next/link';
import { Map, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { DistrictStrength } from '@/lib/services/election-analytics.service';
import Badge from '@/components/ui/Badge';
import PartyBadge from '@/components/ui/PartyBadge';

interface DistrictStrongholdsProps {
  data: DistrictStrength[];
  limit?: number;
}

export default function DistrictStrongholds({ data, limit = 8 }: DistrictStrongholdsProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-10 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Map className="text-indigo-500" size={20} />
          </div>
          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">District Strongholds</h3>
        </div>
        <Badge variant="outline" size="sm" dot className="bg-indigo-50/50 border-indigo-100 text-indigo-600">Regional Strength</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.slice(0, limit).map((district, index) => (
          <div key={index} className="p-6 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-100 transition-all group shadow-sm hover:shadow-xl hover:shadow-slate-200/40">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Link 
                  href={`/tn/districts/${district.districtName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-base font-black text-brand-dark uppercase tracking-tight hover:text-brand-gold transition-colors truncate pr-2"
                >
                  {district.districtName}
                </Link>
                <Link
                  href={`/tn/districts/${district.districtName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-brand-dark group-hover:text-white transition-all shadow-sm flex-shrink-0"
                >
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <PartyBadge
                    party={district.leadPartyShort}
                    logoUrl={district.leadPartyLogoUrl}
                    colorBg={district.colorBg || '#f8fafc'}
                    colorText={district.colorText || '#1e293b'}
                    colorBorder={district.colorBorder || '#e2e8f0'}
                  />

                  <div className="text-right">
                    <span className="text-sm font-black text-brand-dark">{district.seatsWon}</span>
                    <span className="text-[10px] font-bold text-slate-400"> / {district.totalSeats} seats</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${district.winPercentage}%`,
                      backgroundColor: district.colorBorder || district.colorBg || '#164C45'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
