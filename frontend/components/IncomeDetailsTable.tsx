"use client";

interface IncomeDetailsTableProps {
  itrHistory?: Record<string, Record<string, number>> | null;
}

export default function IncomeDetailsTable({ itrHistory }: IncomeDetailsTableProps) {
  if (!itrHistory || Object.keys(itrHistory).length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No detailed ITR records found</p>
      </div>
    );
  }

  // Get all unique year ranges across all relations for row headers
  // Filter out any invalid years like 'None'
  const yearRanges = Array.from(
    new Set(Object.values(itrHistory).flatMap((years) => Object.keys(years)))
  ).filter(yr => yr && yr.toLowerCase() !== "none")
   .sort((a, b) => b.localeCompare(a)); // Sort latest first

  // Get all relations for column headers
  // Filter out 'None' relations and those with no values (except 'self')
  const relations = Object.keys(itrHistory)
    .filter(rel => {
      if (!rel || rel.toLowerCase() === "none") return false;
      if (rel.toLowerCase() === "self") return true;

      // Check if this relation has any non-zero/non-null value across all years
      const years = itrHistory[rel];
      return Object.values(years).some(amt => amt && Number(amt) > 0);
    })
    .sort((a, b) => {
      // Sort 'self' first, then 'spouse', then others
      if (a === 'self') return -1;
      if (b === 'self') return 1;
      if (a === 'spouse') return -1;
      if (b === 'spouse') return 1;
      return a.localeCompare(b);
    });

  const formatCurrency = (amt: number | undefined) => {
    if (amt === undefined || amt === null) return "—";
    if (amt === 0) return "INR 0";
    if (amt >= 10000000) return `INR ${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `INR ${(amt / 100000).toFixed(2)} L`;
    return `INR ${amt.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
      <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-brand-dark">
        <h3 className="text-xl font-black text-white uppercase tracking-wider">Income Tax Details</h3>
        <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
            History and Declarations (Values in INR)
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Year</th>
              {relations.map((rel) => (
                <th key={rel} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize">
                  {rel}
                </th>
              ))}
              <th className="px-6 py-4 text-[10px] font-black text-brand-gold uppercase tracking-widest">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yearRanges.map((yr) => {
              let rowTotal = 0;
              let hasAnyValue = false;
              
              return (
                <tr key={yr} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-black text-brand-dark text-lg">{yr}</td>
                  {relations.map((rel) => {
                    const amount = itrHistory[rel]?.[yr];
                    if (amount !== undefined && amount !== null) {
                        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
                        if (!isNaN(numericAmount)) {
                            rowTotal += numericAmount;
                            hasAnyValue = true;
                        }
                    }
                    return (
                      <td key={rel} className="px-6 py-4">
                        <span className={amount !== undefined ? "font-bold text-slate-700" : "text-slate-300 font-medium"}>
                          {formatCurrency(amount)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 font-black text-brand-dark">
                    {hasAnyValue ? formatCurrency(rowTotal) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50/50 px-10 py-4">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          * Data aggregated from multiple election affidavits. ITR values represent latest self-declared taxable income for the respective financial years.
        </p>
      </div>
    </div>
  );
}
