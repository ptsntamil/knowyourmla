"use client";

import { ElectionExpenseRecord } from "@/types/models";

interface ElectionExpensesWidgetProps {
  expenses?: ElectionExpenseRecord[];
}

export default function ElectionExpensesWidget({ expenses }: ElectionExpensesWidgetProps) {
  if (!expenses || expenses.length === 0) return null;

  const formatCurrency = (amt: number) => {
    if (amt === 0) return "INR 0";
    if (amt >= 10000000) return `INR ${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `INR ${(amt / 100000).toFixed(2)} L`;
    return `INR ${amt.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 mb-8 overflow-hidden relative group">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            Campaign Spending
          </h3>
          <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">
            Election Expenses
          </h2>
        </div>
        <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 8V7m0 1v1m0 9v1m0-1v-1m8-2v1m0-1v-1M4 14v1m0-1v-1m15.364-6.364l-.707.707m.707-.707l.707-.707M6.343 17.657l-.707.707m.707-.707l.707-.707M6.343 6.343l-.707-.707m.707.707l.707.707m11.314 11.314l-.707-.707m.707.707l.707.707" />
            </svg>
        </div>
      </div>

      <div className="space-y-4">
        {expenses.sort((a, b) => b.year - a.year).map((record) => (
          <div key={record.year} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-gold/30 transition-all group-hover:bg-white group-hover:shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{record.year} Election</span>
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-brand-dark truncate max-w-[150px]">
                  {formatCurrency(record.amount)}
                </span>
                {record.growth_percent !== null && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${record.growth_percent >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {record.growth_percent >= 0 ? '↑' : '↓'} {Math.abs(record.growth_percent)}%
                  </span>
                )}
              </div>
            </div>
            {/* Simple progress bar representation */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-brand-gold rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (record.amount / (Number(process.env.NEXT_PUBLIC_ELECTION_EXPENSE_LIMIT) || 4000000)) * 100)}%` }}
                />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          * Figures based on official self-declared election expenditure statements. 
          Limits vary by state and election type.
        </p>
      </div>
    </div>
  );
}
