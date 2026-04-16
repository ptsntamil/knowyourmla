import React from 'react';
import { Share2, ShieldCheck, Zap } from 'lucide-react';

export default function ElectionDashboardSEOContent() {
  return (
    <article className="max-w-none text-slate-600 space-y-12">
      <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-20 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32"></div>
        
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
              Tamil Nadu Assembly <br />Election 2026 Overview
            </h2>
            <div className="w-20 h-2 bg-brand-gold rounded-full"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed font-medium">
                This Tamil Nadu Assembly Election 2026 dashboard provides a comprehensive view of all announced MLA candidates across constituencies. Users can explore constituency-wise candidate lists, track party-wise candidate announcements, and analyze election patterns such as incumbent recontests, open seats, and cross-constituency candidates.
              </p>
              <p className="text-sm leading-loose text-slate-500">
                The platform covers all 234 constituencies in Tamil Nadu, allowing users to quickly find candidates contesting in their constituency and compare profiles across parties.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest italic">Data Veracity</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">All financial and criminal background data is derived from official ECI affidavits filed by candidates. We prioritize accuracy and neutral data presentation above all.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-brand-dark shrink-0">
                  <Zap size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest italic">Real-Time Rollout</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">Unlike static lists, our dashboard updates as parties release candidate names, allowing you to track the momentum of the 2026 election cycle dynamically.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-brand-dark shrink-0">
                  <Share2 size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest italic">Constituency Discovery</h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">Easily toggle between your local seat and state-wide patterns. Understand if your constituency is a battleground or a stronghold for a particular ideology.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-dark rounded-[2.5rem] p-8 md:p-12 text-white border border-white/10 mt-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700"></div>
             <div className="relative z-10 max-w-3xl space-y-4">
                <h3 className="text-xl font-black uppercase tracking-widest italic leading-none">Role of Data in Democracy</h3>
                <p className="text-sm font-medium text-slate-300 leading-relaxed">
                  KnowYourMLA believes that an informed citizen is a powerful citizen. By providing tools to analyze candidate assets, education, and criminal histories side-by-side with historical contest margins, we aim to eliminate the information gap that often persists during high-stakes elections. Use this dashboard to discover the face behind the symbol and the policies behind the personality.
                </p>
             </div>
          </div>
        </div>
      </div>
    </article>
  );
}
