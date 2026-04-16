import React from 'react';
import Link from 'next/link';

interface DashboardHeroProps {
  title: string;
  description: string;
  subtitle?: string;
}

export default function DashboardHero({ title, description, subtitle }: DashboardHeroProps) {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-brand-dark rounded-b-[4rem]">
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] -mr-48 -mt-48 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px] -ml-32 -mb-32 opacity-30"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Breadcrumb / Category Tag */}
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-pulse shadow-[0_0_12px_rgba(255,184,0,0.8)]"></span>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Election Intelligence Live</span>
            </div>
            
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/tn/elections" className="hover:text-white transition-colors">Elections</Link>
              <span>/</span>
              <span className="text-brand-gold">Tamil Nadu 2026</span>
            </nav>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] italic">
              {title}
            </h1>
            <div className="w-24 h-1.5 bg-brand-gold mx-auto rounded-full"></div>
          </div>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>

          {subtitle && (
             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
               {subtitle}
             </p>
          )}

          <div className="pt-4 flex items-center justify-center gap-4">
             <div className="h-px bg-white/10 flex-grow max-w-[100px]"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Data-Driven Transparency</span>
             <div className="h-px bg-white/10 flex-grow max-w-[100px]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
