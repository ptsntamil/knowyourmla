import React from "react";
import { AlertCircle } from "lucide-react";

interface DataQualityNoteProps {
  partyShort: string;
  note: string;
  reportedTotal?: number | null;
  calculatedTotal?: number | null;
  difference?: number | null;
}

export function DataQualityNote({
  partyShort,
  note,
  reportedTotal,
  calculatedTotal,
  difference,
}: DataQualityNoteProps) {
  const formatRs = (val?: number | null) => 
    val != null ? `₹${val.toLocaleString("en-IN")}` : "N/A";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-900">
            Data Quality Note: {partyShort}
          </h4>
          <p className="text-sm text-amber-800 leading-relaxed">{note}</p>
          
          {(reportedTotal != null || calculatedTotal != null) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 mt-3 border-t border-amber-200/50">
              <div>
                <p className="text-xs text-amber-700/80 uppercase font-medium tracking-wide">
                  Reported Total
                </p>
                <p className="font-medium text-amber-900">{formatRs(reportedTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700/80 uppercase font-medium tracking-wide">
                  Calculated Total
                </p>
                <p className="font-medium text-amber-900">{formatRs(calculatedTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700/80 uppercase font-medium tracking-wide">
                  Difference
                </p>
                <p className="font-medium text-amber-900">{formatRs(difference)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
