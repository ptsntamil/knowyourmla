import React from "react";

interface SEOHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export default function SEOHeader({ title, subtitle, children }: SEOHeaderProps) {
  return (
    <header className="relative bg-brand-dark overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32 border-b border-white/5">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-green/20 rounded-full -mr-40 -mt-40 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-brand-gold/10 rounded-full -ml-20 -mb-20 blur-3xl opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Civic Data Archive</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
              {title}
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-slate-400 font-bold leading-relaxed">
            {subtitle}
          </p>

          {children && <div className="pt-8">{children}</div>}
        </div>
      </div>
    </header>
  );
}
