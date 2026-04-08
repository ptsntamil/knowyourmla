import { Target, TrendingUp, Map, BarChart3, Info, Wallet, Baby, Users, Swords, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ElectionInsights as ElectionInsightsType } from '@/lib/services/election-analytics.service';
import ClosestContests from './ClosestContests';
import BiggestVictories from './BiggestVictories';
import DistrictStrongholds from './DistrictStrongholds';
import RichestContestants from './RichestContestants';
import YoungestContestants from './YoungestContestants';
import HighestTurnout from './HighestTurnout';
import LowestTurnout from './LowestTurnout';
import MostCrowdedContests from './MostCrowdedContests';
import LeastCrowdedContests from './LeastCrowdedContests';
import WomenRepresentationSummary from './WomenRepresentationSummary';
import WomenWinners from './WomenWinners';

interface ElectionInsightsProps {
  insights: ElectionInsightsType;
  year: number;
  isTeaser?: boolean;
}

export default function ElectionInsights({ insights, year, isTeaser = false }: ElectionInsightsProps) {
  const limit = isTeaser ? 3 : 5;

  return (
    <div className="space-y-20">
      {/* Section Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center">
            <BarChart3 className="text-brand-gold" size={24} />
          </div>
          <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tight">Election Insights</h2>
        </div>
        <div className="max-w-3xl">
          <p className="text-slate-500 font-medium leading-relaxed">
            {isTeaser 
              ? `A quick analytical preview of the regional battles, participation levels, and contestant demographics that shaped the ${year} assembly.`
              : `Beyond the headlines of seats and vote share, these insights highlight the competitive regional battles, 
                participation levels, and individual contestant profiles that shaped the ${year} assembly.`
            }
            {isTeaser && (
              <Link 
                href={`/tn/elections/${year}/insights`}
                className="text-brand-gold font-black hover:underline ml-1 inline-flex items-center gap-1 group"
              >
                Explore Full Analysis 
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </p>
        </div>
      </div>

      {/* 1. Results-based Insights */}
      <div className="space-y-10">
        <div className="flex items-center gap-3">
          <Target className="text-slate-300" size={18} />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Electoral Outcomes</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ClosestContests data={insights.closestContests} year={year} limit={limit} />
          <BiggestVictories data={insights.biggestVictories} year={year} limit={limit} />
        </div>
      </div>

      {/* 2. Participation Insights */}
      <div className="space-y-10">
        <div className="flex items-center gap-3">
          <Users className="text-slate-300" size={18} />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Voter Participation</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <HighestTurnout data={insights.highestTurnout} year={year} limit={limit} />
          <LowestTurnout data={insights.lowestTurnout} year={year} limit={limit} />
        </div>
      </div>

      {/* 3. Social Representation */}
      <div className="space-y-10">
        <div className="flex items-center gap-3">
          <UserPlus className="text-slate-300" size={18} />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Social Representation</h3>
        </div>
        <div className={isTeaser ? "grid grid-cols-1" : "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"}>
          <WomenRepresentationSummary data={insights.womenRepresentation} year={year} />
          {!isTeaser && <WomenWinners data={insights.womenRepresentation.winners} year={year} />}
        </div>
      </div>

      {/* 4. Contest Dynamics - Hidden in Teaser */}
      {!isTeaser && (
        <div className="space-y-10">
          <div className="flex items-center gap-3">
            <Swords className="text-slate-300" size={18} />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Contest Dynamics</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <MostCrowdedContests data={insights.mostCrowdedContests} year={year} />
            <LeastCrowdedContests data={insights.leastCrowdedContests} year={year} />
          </div>
        </div>
      )}

      {/* 5. Candidate-based Insights - Richest only in Teaser */}
      <div className="space-y-10">
        <div className="flex items-center gap-3">
          <Wallet className="text-slate-300" size={18} />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Contestant Highlights</h3>
        </div>
        <div className={isTeaser ? "grid grid-cols-1" : "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"}>
          <RichestContestants 
            data={insights.richestContestants} 
            year={year} 
            limit={limit} 
            showFilter={!isTeaser} 
          />
          {!isTeaser && (
            <YoungestContestants 
              data={insights.youngestContestants} 
              year={year} 
              limit={limit} 
            />
          )}
        </div>
      </div>

      {/* 6. Regional Dynamics */}
      <div className="space-y-10">
        <div className="flex items-center gap-3">
          <Map className="text-slate-300" size={18} />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Regional Performance</h3>
        </div>
        <div className="grid grid-cols-1">
          <DistrictStrongholds data={insights.strongestDistricts} limit={isTeaser ? 3 : 8} />
        </div>
      </div>

      {/* View Full Insights CTA - Show only in Teaser */}
      {isTeaser && (
        <div className="flex justify-center pt-10">
          <Link 
            href={`/tn/elections/${year}/insights`}
            className="group bg-brand-dark text-white font-black px-12 py-5 rounded-3xl uppercase tracking-[0.2em] text-xs hover:bg-brand-gold hover:text-brand-dark transition-all shadow-2xl shadow-brand-dark/20 flex items-center gap-3 active:scale-95"
          >
            Explore Full {year} Election Insights
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      {/* Note on data */}
      {!isTeaser && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
          <Info className="text-slate-400 mt-1 flex-shrink-0" size={18} />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Analytical Note: These insights are derived from official {year} election data. 
            Winning margins are calculated between the top two candidates. 
            Turnout figures reflect total votes polled relative to the electorate.
            Representational data (Gender, Age) is sourced from verified candidate affidavits.
          </p>
        </div>
      )}
    </div>
  );
}
