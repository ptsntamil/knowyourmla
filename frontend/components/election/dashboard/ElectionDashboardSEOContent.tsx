import { Share2, ShieldCheck, Zap, IndianRupee, Gavel, User, TrendingUp, Target, Award, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { DashboardInsights } from '@/lib/elections/preElectionDashboard/dashboard.types';

interface ElectionDashboardSEOContentProps {
  insights: DashboardInsights;
}

export default function ElectionDashboardSEOContent({ insights }: ElectionDashboardSEOContentProps) {
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

          {/* New Insights Section for SEO */}
          <div className="pt-16 border-t border-slate-100 space-y-16">
            
            {/* 1. Candidate Spotlights */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight italic">Candidate Spotlights</h3>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {/* Richest */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <IndianRupee size={12} /> Top Declared Assets
                  </h4>
                  <ul className="space-y-3">
                    {insights.richestCandidates.slice(0, 5).map((c, i) => (
                      <li key={`rich-${i}`} className="flex items-center justify-between group">
                        <Link href={c.personId ? `/tn/mla/${c.personId}` : '#'} className="text-sm font-bold text-slate-600 hover:text-brand-gold transition-colors flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-brand-gold"></span>
                          {c.name}
                        </Link>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{c.formattedValue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Criminal Cases */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Gavel size={12} /> High Criminal Records
                  </h4>
                  <ul className="space-y-3">
                    {insights.mostCriminalCases.slice(0, 5).map((c, i) => (
                      <li key={`crim-${i}`} className="flex items-center justify-between group">
                        <Link href={c.personId ? `/tn/mla/${c.personId}` : '#'} className="text-sm font-bold text-slate-600 hover:text-brand-gold transition-colors flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-brand-gold"></span>
                          {c.name}
                        </Link>
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">{c.formattedValue} Cases</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Youngest/Oldest Mixed */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={12} /> Demographic Extremes
                  </h4>
                  <ul className="space-y-3">
                    {insights.youngestCandidates.slice(0, 2).map((c, i) => (
                      <li key={`young-${i}`} className="flex items-center justify-between group">
                        <Link href={c.personId ? `/tn/mla/${c.personId}` : '#'} className="text-sm font-bold text-slate-600 hover:text-brand-gold transition-colors flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-brand-gold"></span>
                          {c.name} (Youngest)
                        </Link>
                        <span className="text-[10px] font-black text-brand-gold bg-brand-gold/5 px-2 py-0.5 rounded-lg">{c.formattedValue} Yrs</span>
                      </li>
                    ))}
                    {insights.oldestCandidates.slice(0, 2).map((c, i) => (
                      <li key={`old-${i}`} className="flex items-center justify-between group">
                        <Link href={c.personId ? `/tn/mla/${c.personId}` : '#'} className="text-sm font-bold text-slate-600 hover:text-brand-gold transition-colors flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-brand-gold"></span>
                          {c.name} (Oldest)
                        </Link>
                        <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">{c.formattedValue} Yrs</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Election Strategy */}
            <section className="bg-slate-50/50 rounded-[2rem] p-8 md:p-12 border border-slate-100 space-y-10">
              <div className="grid lg:grid-cols-2 gap-16">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <Award size={20} />
                    </div>
                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight italic">Star Candidates & Profiles</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">
                    High-profile figures and key leadership from major alliances including DMK, AIADMK, BJP, and NTK. 
                    These candidates often dictate the narrative of the 2026 election cycle.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {insights.starCandidates.slice(0, 10).map((c, i) => (
                      <Link 
                        key={`star-${i}`} 
                        href={c.personId ? `/tn/mla/${c.personId}` : '#'}
                        className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 hover:border-brand-gold hover:text-brand-gold transition-all shadow-sm flex items-center gap-2"
                      >
                         {c.name} <ExternalLink size={10} />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <Target size={20} />
                    </div>
                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight italic">Multi-Seat Strategies</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Candidates contesting in more than one constituency highlight defensive or expansive strategies by their respective parties.
                  </p>
                  <ul className="space-y-4">
                    {insights.multiConstituencyCandidates?.slice(0, 3).map((c, i) => (
                      <li key={`multi-${i}`} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                          <Link href={c.personId ? `/tn/mla/${c.personId}` : '#'} className="text-xs font-black text-brand-dark uppercase italic hover:text-brand-gold">{c.name}</Link>
                          <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">{c.count} Seats</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.constituencies.join(' • ')}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Contest Dynamics */}
            <section className="space-y-10 py-8">
              <div className="max-w-3xl">
                <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight italic mb-4">Battleground Constituencies</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Analyzing constituencies where the 2021 results were decided by razor-thin margins and identifying new multi-cornered contests for 2026.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Narrow Margins */}
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Closest Seats (Historical 2021)</h4>
                  <div className="space-y-4">
                    {insights.closestLastElectionSeats.slice(0, 4).map((seat, i) => (
                      <div key={`closest-${i}`} className="flex justify-between items-center">
                        <div>
                          <Link href={`/tn/constituency/${seat.constituencyId}`} className="text-xs font-black text-slate-700 hover:text-brand-gold uppercase">{seat.constituencyName}</Link>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{seat.lastWinnerParty}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-rose-500 uppercase">{seat.lastMargin?.toLocaleString()} Margin</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Corner */}
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Multi-Corner Contests (2026)</h4>
                  <div className="space-y-4">
                    {insights.multiCornerContests.slice(0, 4).map((seat, i) => (
                      <div key={`multi-corner-${i}`} className="flex justify-between items-center">
                        <div>
                          <Link href={`/tn/constituency/${seat.constituencyId}`} className="text-xs font-black text-slate-700 hover:text-brand-gold uppercase">{seat.constituencyName}</Link>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{seat.districtName}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-brand-gold uppercase">{seat.candidateCount} Major Candidates</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
