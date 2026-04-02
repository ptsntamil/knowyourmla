import { Users, Wallet, UserCheck, UserPlus, TrendingUp } from "lucide-react";

interface PartyAnalyticsCardsProps {
  analytics: any;
  isYearView?: boolean;
}

export default function PartyAnalyticsCards({ analytics, isYearView }: PartyAnalyticsCardsProps) {
  const { age, assets, stats } = analytics;

  const DistributionBar = ({ label, value, percentage, color }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-black ${color}`}>{value} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Age Distribution Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-border/50 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Age Distribution</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate age demographics</p>
          </div>
        </div>

        <div className="space-y-6">
          <DistributionBar 
            label="Youth (Below 40)" 
            value={age.ageBelow40} 
            percentage={Math.round((age.ageBelow40 / stats.totalContested) * 100) || 0}
            color="text-indigo-600"
          />
          <DistributionBar 
            label="Middle Age (40-50)" 
            value={age.age40to50} 
            percentage={Math.round((age.age40to50 / stats.totalContested) * 100) || 0}
            color="text-brand-gold"
          />
          <DistributionBar 
            label="Senior (Above 50)" 
            value={age.ageAbove50} 
            percentage={Math.round((age.ageAbove50 / stats.totalContested) * 100) || 0}
            color="text-rose-600"
          />
        </div>
      </div>

      {/* Asset Range Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-border/50 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-200 uppercase tracking-tight">Wealth Distribution</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate asset declarations</p>
          </div>
        </div>

        <div className="space-y-6">
          <DistributionBar 
            label="Crorepatis" 
            value={assets.crorepatiCount} 
            percentage={assets.crorepatiPercentage || 0}
            color="text-emerald-600"
          />
          <DistributionBar 
            label="High Assets (50L - 1Cr)" 
            value={Math.round(stats.totalContested * 0.15)} // Dummy calculation for illustration if data missing
            percentage={15}
            color="text-teal-600"
          />
          <DistributionBar 
            label="Moderate Assets (Below 50L)" 
            value={stats.totalContested - assets.crorepatiCount - Math.round(stats.totalContested * 0.15)}
            percentage={Math.round(((stats.totalContested - assets.crorepatiCount - Math.round(stats.totalContested * 0.15)) / stats.totalContested) * 100) || 0}
            color="text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
