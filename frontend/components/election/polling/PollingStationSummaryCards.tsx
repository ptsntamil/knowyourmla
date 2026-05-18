import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  UserCheck 
} from 'lucide-react';

interface SummaryCardsProps {
  totalPS: number;
  highestTurnout: string;
  lowestTurnout: string;
  closestContest: string;
  highestMargin: string;
  highestNota: string;
}

const PollingStationSummaryCards: React.FC<SummaryCardsProps> = ({
  totalPS,
  highestTurnout,
  lowestTurnout,
  closestContest,
  highestMargin,
  highestNota
}) => {
  const cards = [
    {
      label: "Total Polling Stations",
      value: totalPS,
      icon: BarChart3,
      bgColor: "bg-brand-dark/5",
      borderColor: "border-brand-dark/10"
    },
    {
      label: "Highest Turnout Booth",
      value: `PS ${highestTurnout}`,
      icon: TrendingUp,
      bgColor: "bg-brand-green/5",
      borderColor: "border-brand-green/10"
    },
    {
      label: "Lowest Turnout Booth",
      value: `PS ${lowestTurnout}`,
      icon: TrendingDown,
      bgColor: "bg-rose-50",
      borderColor: "border-rose-100"
    },
    {
      label: "Closest Contest Booth",
      value: `PS ${closestContest}`,
      icon: Target,
      bgColor: "bg-brand-gold/5",
      borderColor: "border-brand-gold/10"
    },
    {
      label: "Highest Margin Booth",
      value: `PS ${highestMargin}`,
      icon: UserCheck,
      bgColor: "bg-brand-dark/5",
      borderColor: "border-brand-dark/10"
    },
    {
      label: "Highest NOTA Booth",
      value: `PS ${highestNota}`,
      icon: ShieldAlert,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, index) => (
        <div 
          key={index}
          className="bg-[#F8F6F1] border border-[#F4B63D]/20 border-t-4 border-t-[#F4B63D] rounded-2xl p-4 md:p-5 transition-all hover:shadow-xl hover:shadow-[#F4B63D]/10 hover:-translate-y-0.5 active:scale-[0.98] cursor-default group relative overflow-hidden h-full flex flex-col justify-between"
        >
          {/* Elegant gold corner glow */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F4B63D]/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <p className="text-[#5C6773] text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em]">{card.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-[#0D1B2A] tabular-nums leading-none tracking-tight">
                  {card.value}
                </h3>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-[#F4B63D] rounded-full group-hover:w-8 transition-all duration-500" />
                <p className="text-[8px] text-[#7D8790] font-black uppercase tracking-widest">Metric</p>
              </div>
            </div>

            <div className="p-2 md:p-2.5 bg-[#071120] rounded-xl shadow-lg shadow-[#071120]/10 group-hover:bg-[#F4B63D] group-hover:shadow-[#F4B63D]/20 transition-all duration-500 self-start md:self-auto">
              <card.icon className="w-4 h-4 md:w-5 md:h-5 text-[#F4B63D] group-hover:text-[#071120] transition-colors duration-500" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PollingStationSummaryCards;
