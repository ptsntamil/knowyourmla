"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, MapPin, Landmark, Lightbulb } from 'lucide-react';

const TABS = [
  { name: 'Overview', href: '/tn/elections/2026/dashboard', icon: LayoutDashboard },
  { name: 'Candidates', href: '/tn/elections/2026/candidates', icon: Users },
  { name: 'Constituencies', href: '/tn/elections/2026/constituencies', icon: MapPin },
  { name: 'Parties', href: '/tn/elections/2026/parties', icon: Landmark },
  { name: 'Insights', href: '/tn/elections/2026/insights', icon: Lightbulb },
];

export default function ElectionNavTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center overflow-x-auto no-scrollbar -mb-px">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-6 py-5 border-b-2 transition-all whitespace-nowrap group ${
                  isActive 
                    ? 'border-brand-gold text-brand-dark' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                }`}
              >
                <Icon 
                  size={16} 
                  className={isActive ? 'text-brand-gold' : 'text-slate-300 group-hover:text-slate-400'} 
                />
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
