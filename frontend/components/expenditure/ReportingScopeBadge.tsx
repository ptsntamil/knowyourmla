import React from 'react';
import { Info } from 'lucide-react';

interface ReportingScopeBadgeProps {
  scope: string;
}

export const ReportingScopeBadge: React.FC<ReportingScopeBadgeProps> = ({ scope }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500 max-w-full">
      <Info size={12} className="text-slate-400 flex-shrink-0" />
      <span className="truncate">{scope}</span>
    </div>
  );
};
