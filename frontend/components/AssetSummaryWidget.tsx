"use client";

import { Car, MapPin, Coins } from "lucide-react";

interface AssetSummaryWidgetProps {
    goldAssets?: any;
    vehicleAssets?: any;
    landAssets?: any;
}

export default function AssetSummaryWidget({ goldAssets, vehicleAssets, landAssets }: AssetSummaryWidgetProps) {
    // 1. Calculate Total Gold (grams)
    let totalGold = 0;
    if (goldAssets) {
        Object.values(goldAssets).forEach((item: any) => {
            const goldStr = item?.gold || "";
            // Handle various formats: "40 Gram", "577 gram", "97.48 gram"
            const match = goldStr.match(/([\d.]+)\s*(gram|Gram|Grams|grams)/i);
            if (match) {
                totalGold += parseFloat(match[1]);
            }
        });
    }

    // 2. Calculate Vehicle Count
    let vehicleCount = 0;
    if (vehicleAssets) {
        Object.values(vehicleAssets).forEach((list: any) => {
            if (Array.isArray(list)) {
                vehicleCount += list.length;
            }
        });
    }

    // 3. Calculate Land (Acres + Cents)
    let totalAcres = 0;
    let totalCents = 0;
    if (landAssets) {
        Object.values(landAssets).forEach((item: any) => {
            const calculated = item?.total?.calculated;
            if (calculated) {
                totalAcres += parseFloat(calculated.acres || 0);
                totalCents += parseFloat(calculated.cents || 0);
            }
        });
    }
    // Normalize cents
    if (totalCents >= 100) {
        totalAcres += Math.floor(totalCents / 100);
        totalCents = parseFloat((totalCents % 100).toFixed(2));
    }

    return (
        <section className="space-y-8">
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Detailed Asset Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Gold Widget */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-gold/10 transition-colors" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center mb-6 rotate-3 group-hover:rotate-6 transition-transform shadow-inner">
                            <Coins className="w-8 h-8 text-brand-gold" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-5xl font-black text-brand-dark tracking-tighter tabular-nums">
                                {totalGold > 0 ? totalGold.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "None"}
                            </span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Grams</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-6 opacity-60">Total Gold Assets</p>
                    </div>
                </div>

                {/* Vehicle Widget */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-green/10 transition-colors" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 -rotate-3 group-hover:-rotate-6 transition-transform shadow-inner">
                            <Car className="w-8 h-8 text-brand-green" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-5xl font-black text-brand-dark tracking-tighter tabular-nums">
                                {vehicleCount || "0"}
                            </span>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Units</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-6 opacity-60">Vehicle Count</p>
                    </div>
                </div>

                {/* Land Widget */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-50 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 rotate-2 group-hover:rotate-4 transition-transform shadow-inner">
                            <MapPin className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                             <div className="flex flex-col items-center">
                                <span className="text-4xl font-black text-brand-dark tracking-tighter tabular-nums">{totalAcres}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acres</span>
                             </div>
                             {totalCents > 0 && (
                                <>
                                    <span className="text-2xl font-black text-slate-200">/</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-black text-brand-dark tracking-tighter tabular-nums">{totalCents}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cents</span>
                                    </div>
                                </>
                             )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-6 opacity-60">Immovable Land Area</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
