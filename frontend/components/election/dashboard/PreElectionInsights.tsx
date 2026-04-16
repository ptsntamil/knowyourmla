"use client";

import React from 'react';
import { DashboardInsights, ElectionInsightCandidate, ContestCard } from '@/lib/elections/preElectionDashboard/dashboard.types';
import PartyBadge from '@/components/ui/PartyBadge';
import Link from 'next/link';
import { Trophy, TrendingUp, AlertTriangle, Scale, Target, Users, MapPin, IndianRupee, Gavel } from 'lucide-react';

interface PreElectionInsightsProps {
  insights: DashboardInsights;
}

const SECTION_DESCRIPTIONS = {
  candidateIntelligence: "Insights from candidate affidavits revealing financial strength, education, and criminal background.",
  multiConstituency: "Candidates identified as contesting from more than one assembly seat in the 2026 election cycle.",
  constituencyPatterns: "Analysis of contest density and historical margins across constituencies.",
  electionShape: "Macroscopic view of the election landscape including seat types and demographics.",
  contestingPatterns: "Strategic patterns in candidate placement and regional focus by political parties."
};

export default function PreElectionInsightsSection({ insights }: PreElectionInsightsProps) {

  const CardWrapper = ({ title, icon: Icon, children, href, footerHref, footerLabel }: { title: string, icon: any, children: React.ReactNode, href?: string, footerHref?: string, footerLabel?: string }) => {
    const content = (
      <div className={`bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col h-full transition-all ${href ? 'hover:border-brand-gold/30 hover:shadow-brand-gold/10' : ''}`}>
        <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-brand-dark uppercase tracking-[0.1em] text-xs italic">{title}</h3>
          <div className="w-8 h-8 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
            <Icon size={16} />
          </div>
        </div>
        <div className="divide-y divide-slate-50 flex-grow">
          {children}
        </div>
        {(footerHref && footerLabel) && (
          <Link href={footerHref} className="p-5 bg-slate-50/50 border-t border-slate-100 text-center group/footer">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/footer:text-brand-gold transition-colors italic">
              {footerLabel} →
            </span>
          </Link>
        )}
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="block h-full group">
          {content}
        </Link>
      );
    }

    return content;
  };

  const SectionHeader = ({ title, description, badge }: { title: string, description: string, badge?: string }) => (
    <div className="space-y-3 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
          <h2 className="text-xl md:text-2xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
            {title}
          </h2>
        </div>
        {badge && (
          <span className="bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-brand-gold/20">
            {badge}
          </span>
        )}
      </div>
      <p className="text-slate-500 font-medium text-sm max-w-2xl">
        {description}
      </p>
    </div>
  );

  const renderCandidateItem = (c: ElectionInsightCandidate, idx: number) => (
    <div key={`${c.name}-${idx}`} className="group p-6 flex items-center justify-between hover:bg-slate-50/20 transition-all">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-2xl border border-brand-gold/20 bg-slate-50 overflow-hidden flex items-center justify-center text-[10px] font-black text-brand-gold group-hover:border-brand-gold transition-all relative shrink-0 italic">
          {c.profilePic ? (
            <img src={c.profilePic} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <span>#{idx + 1}</span>
          )}
        </div>
        <div className="min-w-0">
          <Link href={`/tn/mla/${c.personId}`} className="block">
            <div className="font-black text-brand-dark text-sm uppercase italic tracking-tight leading-none mb-1.5 hover:text-brand-gold transition-colors truncate">
              {c.name}
            </div>
          </Link>
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.constituencyName}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0"></span>
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{c.party}</span>
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-black text-slate-900 italic">{c.formattedValue}</span>
      </div>
    </div>
  );

  const renderContestItem = (c: ContestCard, idx: number, value: string | number, label: string) => (
    <div key={`${c.constituencyId}-${idx}`} className="group p-6 flex items-center justify-between hover:bg-slate-50/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-brand-gold/20 flex items-center justify-center text-[10px] font-black text-brand-gold group-hover:border-brand-gold transition-all italic shrink-0">
          #{idx + 1}
        </div>
        <div className="min-w-0">
          <div className="font-black text-brand-dark text-sm uppercase italic tracking-tight leading-none mb-1.5 group-hover:text-brand-gold transition-colors block truncate">
            {c.constituencyName}
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">{c.districtName}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-sm font-black text-slate-900 italic">{value}</span>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mt-1">{label}</p>
      </div>
    </div>
  );
  const renderMultiConstituencyItem = (c: any, idx: number) => (
    <div key={`${c.personId}-${idx}`} className="group p-6 flex flex-col gap-3 hover:bg-slate-50/20 transition-all border-b border-slate-50 last:border-0">
      <Link href={`/tn/mla/${c.personId}`} className="flex items-center justify-between group">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-2xl border border-brand-gold/20 bg-slate-50 overflow-hidden flex items-center justify-center text-[10px] font-black text-brand-gold group-hover:border-brand-gold transition-all shrink-0">
            {c.partyLogoUrl ? (
              <img src={c.partyLogoUrl} alt={c.partyName} className="w-full h-full object-contain p-2" />
            ) : (
              <span>#{idx + 1}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-black text-brand-dark text-sm uppercase italic tracking-tight leading-none mb-1.5 hover:text-brand-gold transition-colors block truncate">
              {c.name}
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">{c.partyName || 'Independent'}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="bg-brand-gold text-brand-dark text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
            {c.count} Seats
          </span>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 pl-14">
        <p className="text-[10px] font-medium text-slate-400 italic">
          Contesting in: <span className="text-slate-600 font-bold not-italic">{c.constituencies.join(", ")}</span>
        </p>
      </div>
    </div>
  );

  const highlights = [
    {
      label: "Cross-Constituency",
      value: `${insights.contestTypePatterns?.crossPercent || 0}%`,
      description: "Candidates contesting outside home turf",
      icon: MapPin,
    },
    {
      label: "Open Seats",
      value: insights.openSeatsCount,
      description: "No sitting MLA re-contesting",
      icon: Target,
    },
    ...(insights.multiConstituencyCandidates && insights.multiConstituencyCandidates.length > 0 ? [{
      label: "Multi-Seat Candidates",
      value: insights.multiConstituencyCandidates.length,
      description: "Contesting in more than 1 seat",
      icon: Trophy,
    }] : []),
    {
      label: "Max Candidates",
      value: insights.multiCornerContests[0]?.candidateCount || 0,
      description: `In ${insights.multiCornerContests[0]?.constituencyName || 'any constituency'}`,
      icon: Users,
    },
    {
      label: "Youngest Candidate",
      value: `${insights.youngestCandidates[0]?.value || 0}`,
      description: "Minimum age required is 25",
      icon: TrendingUp,
    },
    {
      label: "Highest Criminal Record",
      value: insights.mostCriminalCases[0]?.value || 0,
      description: "Maximum cases for a single candidate",
      icon: AlertTriangle,
    }
  ].slice(0, 5); // Keep to top 5 for consistency

  return (
    <div className="space-y-20 pb-20">
      {/* Header & SEO Intro */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-brand-gold rounded-full" />
              <h1 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter italic leading-none">
                Election Insights 2026
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
              Explore key insights from Tamil Nadu Assembly Election 2026, including candidate profiles, constituency patterns, and election trends based on affidavit data.
            </p>
          </div>
        </div>

        {/* Key Highlights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {highlights.map((h, i) => (
            <div key={i} className="bg-brand-dark rounded-[2rem] p-6 text-white border border-white/5 shadow-2xl shadow-brand-dark/20 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-gold/10 rounded-full blur-2xl group-hover:bg-brand-gold/20 transition-all" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-gold">
                  <h.icon size={20} />
                </div>
                <div>
                  <p className="text-3xl font-black italic tracking-tighter leading-none mb-1">{h.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1">{h.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">{h.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Candidate Intelligence */}
      <section>
        <SectionHeader 
          title="Candidate Intelligence" 
          description={SECTION_DESCRIPTIONS.candidateIntelligence}
          badge="Affidavit Deep-Dive"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          <CardWrapper 
            title="Richest Candidates" 
            icon={IndianRupee}
            footerHref="/tn/elections/2026/candidates?sortBy=assets&sortOrder=desc"
            footerLabel="View Full List"
          >
            {insights.richestCandidates.slice(0, 5).map((c, idx) => renderCandidateItem(c, idx))}
          </CardWrapper>

          <CardWrapper 
            title="Youngest Candidates" 
            icon={TrendingUp}
            footerHref="/tn/elections/2026/candidates?sortBy=age&sortOrder=asc"
            footerLabel="View Full List"
          >
            {insights.youngestCandidates.slice(0, 5).map((c, idx) => renderCandidateItem(c, idx))}
          </CardWrapper>

          {insights.mostCriminalCases.length > 0 && (
            <CardWrapper 
              title="Highest Criminal Record" 
              icon={Gavel}
              footerHref="/tn/elections/2026/candidates?sortBy=cases&sortOrder=desc"
              footerLabel="View Full List"
            >
              {insights.mostCriminalCases.slice(0, 5).map((c, idx) => renderCandidateItem(c, idx))}
            </CardWrapper>
          )}
        </div>
      </section>

      {/* Section 2: Multi-Constituency Candidates */}
      <section>
        <SectionHeader 
          title="Multiple Constituency Candidates" 
          description={SECTION_DESCRIPTIONS.multiConstituency}
          badge="High Signal"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          <CardWrapper 
            title="Multi-Seat Contestants" 
            icon={Trophy}
            footerHref="/tn/elections/2026/candidates?q=Multi-Seat"
            footerLabel="View Analysis"
          >
            {insights.multiConstituencyCandidates && insights.multiConstituencyCandidates.length > 0 ? (
              <div className="flex flex-col">
                {insights.multiConstituencyCandidates.slice(0, 5).map((c, idx) => renderMultiConstituencyItem(c, idx))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-3 bg-slate-50/50">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto border border-dashed border-slate-200">
                  <Trophy size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-brand-dark uppercase tracking-tight italic">No candidates found</p>
                  <p className="text-[10px] font-medium text-slate-400">No candidates are currently contesting in multiple constituencies. This may change as more candidates are announced.</p>
                </div>
              </div>
            )}
          </CardWrapper>
        </div>
      </section>

      {/* Section 3: Constituency Patterns */}
      <section>
        <SectionHeader 
          title="Constituency Patterns" 
          description={SECTION_DESCRIPTIONS.constituencyPatterns}
          badge="Contest Density"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          <CardWrapper 
            title="Closest 2021 Contests" 
            icon={Target}
            footerHref="/tn/elections/2026/constituencies?pattern=Close%20Margin"
            footerLabel="Explore Seats"
          >
            {insights.closestLastElectionSeats.slice(0, 5).map((c, idx) =>
              renderContestItem(c, idx, c.lastMargin?.toLocaleString() || '--', '21 Margin')
            )}
          </CardWrapper>

          <CardWrapper 
            title="Most Crowded Contests" 
            icon={Users}
            footerHref="/tn/elections/2026/constituencies?q=Multi-Corner"
            footerLabel="Explore Seats"
          >
            {insights.multiCornerContests.slice(0, 5).map((c, idx) =>
              renderContestItem(c, idx, c.candidateCount, 'Candidates')
            )}
          </CardWrapper>
        </div>
      </section>

      {/* Horizontal Layout for Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Section 3: Election Shape */}
        <section className="space-y-8">
          <SectionHeader 
            title="Election Shape" 
            description={SECTION_DESCRIPTIONS.electionShape}
            badge="Broad Trends"
          />
          <CardWrapper title="Election Shape Stats" icon={Scale}>
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl group hover:bg-slate-100 transition-all cursor-default text-left">
                <div>
                  <p className="text-2xl font-black italic text-brand-dark">{insights.openSeatsCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Seats</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm group-hover:scale-110 transition-transform shrink-0">
                  <span className="text-xl font-black italic">!</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl group hover:bg-slate-100 transition-all cursor-default text-left">
                <div>
                  <p className="text-2xl font-black italic text-brand-dark">{insights.incumbentRecontestCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sitting MLAs Fielding</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm group-hover:scale-110 transition-transform shrink-0">
                  <Users size={20} />
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl group hover:bg-slate-100 transition-all cursor-default text-left">
                <div>
                  <p className="text-2xl font-black italic text-brand-dark">{insights.averageCandidateAge || '--'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Age</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm group-hover:scale-110 transition-transform shrink-0">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
          </CardWrapper>
        </section>

        {/* Section 4: Contesting Patterns */}
        {insights.contestTypePatterns && (
          <section className="space-y-8">
            <SectionHeader 
              title="Contesting Patterns" 
              description={SECTION_DESCRIPTIONS.contestingPatterns}
              badge="Strategic Moves"
            />
            <CardWrapper 
              title="Contesting Patterns" 
              icon={MapPin}
              footerHref="/tn/elections/2026/candidates?contestType=cross_constituency"
              footerLabel="View Candidates"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <p className="text-3xl font-black italic text-brand-dark">{insights.contestTypePatterns.crossPercent}%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cross-Constituency</p>
                  </div>
                  <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                      <circle
                        cx="32" cy="32" r="28" fill="transparent" stroke="#eab308" strokeWidth="8"
                        strokeDasharray={175.9}
                        strokeDashoffset={175.9 * (1 - insights.contestTypePatterns.crossPercent / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black italic text-brand-dark">AI</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Top Cross-Contest Parties</h4>
                  <div className="space-y-3">
                    {insights.contestTypePatterns.topCrossParties.map((p: any) => (
                      <div key={p.partyName} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <PartyBadge 
                            party={p.partyName}
                            shortName={p.shortName}
                            logoUrl={p.partyLogoUrl}
                            showName={false}
                            className="!w-6 !h-6"
                          />
                          <span className="text-[10px] font-bold text-slate-700">{p.partyName}</span>
                        </div>
                        <span className="text-[10px] font-black text-brand-gold italic">{p.count} Candidates</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardWrapper>
          </section>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-12 border-t border-slate-100 flex flex-col items-center gap-8">
        <p className="text-slate-400 text-sm font-medium italic">Based on 2026 declared candidates so far</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/tn/elections/2026/candidates"
            className="px-8 py-3 bg-white border border-slate-200 text-brand-dark font-black uppercase tracking-widest text-xs italic rounded-2xl hover:border-brand-gold hover:text-brand-gold transition-all"
          >
            Explore All Candidates
          </Link>
          <Link 
            href="/tn/elections/2026/constituencies"
            className="px-8 py-3 bg-white border border-slate-200 text-brand-dark font-black uppercase tracking-widest text-xs italic rounded-2xl hover:border-brand-gold hover:text-brand-gold transition-all"
          >
            View All Constituencies
          </Link>
          <Link 
            href="/tn/elections/2026/dashboard"
            className="px-8 py-3 bg-brand-dark text-white font-black uppercase tracking-widest text-xs italic rounded-2xl hover:bg-brand-gold hover:text-brand-dark transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
