"use client";

import React from 'react';
import Link from 'next/link';
import { Users, MapPin, Landmark, BarChart2, ArrowRight } from 'lucide-react';

export default function ElectionQuickView() {
  const navItems = [
    {
      title: "Explore Candidates",
      subtitle: "Browse announced candidates across Tamil Nadu",
      icon: Users,
      href: "/tn/elections/2026/candidates",
      color: "bg-blue-50 text-blue-600 border-blue-100",
      hover: "hover:border-blue-200 hover:shadow-blue-900/5"
    },
    {
      title: "Explore Constituencies",
      subtitle: "Analyze contest dynamics across 234 seats",
      icon: MapPin,
      href: "/tn/elections/2026/constituencies",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      hover: "hover:border-emerald-200 hover:shadow-emerald-900/5"
    },
    {
      title: "View Party Tracker",
      subtitle: "Track party-wise rollout and strategy",
      icon: Landmark,
      href: "/tn/elections/2026/parties",
      color: "bg-purple-50 text-purple-600 border-purple-100",
      hover: "hover:border-purple-200 hover:shadow-purple-900/5"
    },
    {
      title: "View Insights",
      subtitle: "Deep dive into financial and criminal data",
      icon: BarChart2,
      href: "/tn/elections/2026/insights",
      color: "bg-amber-50 text-amber-600 border-amber-100",
      hover: "hover:border-amber-200 hover:shadow-amber-900/5"
    }
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {navItems.map((item, idx) => (
        <Link 
          key={idx} 
          href={item.href}
          className={`group flex flex-col p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1 ${item.hover}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 ${item.color}`}>
              <item.icon size={28} />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 transition-colors group-hover:bg-brand-gold/10 group-hover:text-brand-gold">
              <ArrowRight size={18} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight italic leading-tight">
              {item.title}
            </h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              {item.subtitle}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
