import React from "react";

interface DistrictElectorateProps {
  year: number;
  total_electors: number;
  male?: number;
  female?: number;
  third_gender?: number;
}

export default function DistrictElectorate({
  year,
  total_electors,
  male = 0,
  female = 0,
  third_gender = 0
}: DistrictElectorateProps) {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm p-10 space-y-10 h-full">
      <div className="space-y-2">
        <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">District Electorate</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data as of Election {year}</p>
      </div>

      <div className="space-y-8">
        {/* Male */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male</span>
            <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{male.toLocaleString()}</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-dark rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(male / total_electors) * 100}%` }}
            />
          </div>
        </div>

        {/* Female */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female</span>
            <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{female.toLocaleString()}</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gold rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(female / total_electors) * 100}%` }}
            />
          </div>
        </div>

        {/* Others */}
        {third_gender > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Others</span>
              <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{third_gender.toLocaleString()}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(third_gender / total_electors) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-slate-50">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Electors</span>
          <span className="text-lg font-black text-brand-green" suppressHydrationWarning>{total_electors.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
