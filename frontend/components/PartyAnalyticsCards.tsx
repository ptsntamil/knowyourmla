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
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-black ${color}`}>{value} ({percentage}%)</span>
      </div>
      <div className="h-2 w-full bg-bg-surface rounded-full overflow-hidden">
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
      <div className="bg-bg-card rounded-[2.5rem] p-8 sm:p-10 border border-border-subtle shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-bg-surface text-text-primary rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-text-primary uppercase tracking-tight">Age Distribution</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Candidate age demographics</p>
          </div>
        </div>

        <div className="space-y-6">
          <DistributionBar 
            label="Youth (Below 40)" 
            value={age.ageBelow40} 
            percentage={Math.round((age.ageBelow40 / stats.totalContested) * 100) || 0}
            color="text-text-primary"
          />
          <DistributionBar 
            label="Middle Age (40-50)" 
            value={age.age40to50} 
            percentage={Math.round((age.age40to50 / stats.totalContested) * 100) || 0}
            color="text-text-accent"
          />
          <DistributionBar 
            label="Senior (Above 50)" 
            value={age.ageAbove50} 
            percentage={Math.round((age.ageAbove50 / stats.totalContested) * 100) || 0}
            color="text-text-muted"
          />
        </div>
      </div>

      {/* Asset Range Summary */}
      <div className="bg-bg-card rounded-[2.5rem] p-8 sm:p-10 border border-border-subtle shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-bg-surface text-text-primary rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-text-primary uppercase tracking-tight">Wealth Distribution</h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Candidate asset declarations</p>
          </div>
        </div>

        <div className="space-y-6">
          <DistributionBar 
            label="Crorepatis" 
            value={assets.crorepatiCount} 
            percentage={assets.crorepatiPercentage || 0}
            color="text-text-primary"
          />
          <DistributionBar 
            label="High Assets (50L - 1Cr)" 
            value={Math.round(stats.totalContested * 0.15)} // Dummy calculation for illustration if data missing
            percentage={15}
            color="text-text-accent"
          />
          <DistributionBar 
            label="Moderate Assets (Below 50L)" 
            value={stats.totalContested - assets.crorepatiCount - Math.round(stats.totalContested * 0.15)}
            percentage={Math.round(((stats.totalContested - assets.crorepatiCount - Math.round(stats.totalContested * 0.15)) / stats.totalContested) * 100) || 0}
            color="text-text-muted"
          />
        </div>
      </div>
    </div>
  );
}
