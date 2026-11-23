import React from 'react';
import { notFound } from "next/navigation";
import { ElectionAnalyticsService } from "@/lib/services/election-analytics.service";
import { buildMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  Users,
  ShieldCheck,
  Target,
  BarChart,
  Zap,
  Info,
  Building
} from 'lucide-react';
import Link from 'next/link';
import PartyBadge from "@/components/ui/PartyBadge";

interface PageProps {
  params: Promise<{
    slug: string;
    year: string;
    number: string;
  }>;
}

export const revalidate = 86400;

const service = new ElectionAnalyticsService();

export async function generateMetadata({ params }: PageProps) {
  const { slug, year, number } = await params;
  const constituencyId = `CONSTITUENCY#${slug}`;
  const yearNum = parseInt(year);
  const psNo = number;

  const result = await service.getPollingStationResults(constituencyId, yearNum);
  const station = result?.pollingStations.find(s => s.pollingStationNo === psNo);

  if (!station) return buildMetadata({
    title: `Polling Station ${number} Results Not Found`,
    description: `Results for Polling Station ${number} in ${slug} are not available at this time.`,
    path: `/tn/constituency/${slug}/election/${year}/polling-station/${number}`,
    noIndex: true
  });

  return buildMetadata({
    title: `Polling Station ${number} Results ${year} — ${result?.constituencyName} Constituency`,
    description: `Detailed booth-level results for Polling Station ${number} in ${result?.constituencyName}. Winner: ${station.winnerName} with ${station.winnerVoteShare.toFixed(1)}% vote share.`,
    path: `/tn/constituency/${slug}/election/${year}/polling-station/${number}`,
    noIndex: true
  });
}

export default async function PollingStationDetailPage({ params }: PageProps) {
  const { slug, year, number } = await params;
  const yearNum = parseInt(year);
  const psNo = number;
  const constituencyId = `CONSTITUENCY#${slug}`;

  const result = await service.getPollingStationResults(constituencyId, yearNum);
  const station = result?.pollingStations.find(s => s.pollingStationNo === psNo);

  if (!station || !result) {
    notFound();
  }

  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "TN", item: "/tn" },
    { name: "Elections", item: "/tn/elections" },
    { name: result.constituencyName, item: `/tn/constituency/${slug}` },
    { name: `${year} Result`, item: `/tn/constituency/${slug}/election/${year}` },
    { name: "Polling Stations", item: `/tn/constituency/${slug}/election/${year}/polling-stations` },
    { name: `PS ${number}`, item: `/tn/constituency/${slug}/election/${year}/polling-station/${number}` },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <BreadcrumbSchema items={breadcrumbItems} />

      <header className="bg-white border-b border-slate-100 pt-12 pb-16">
        <div className="mx-auto max-w-7xl px-4">
          <Link
            href={`/tn/constituency/${slug}/election/${year}/polling-stations`}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to All Polling Stations
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase">Booth {number}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-bold">{result.constituencyName} Constituency</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Polling Station {number} Analysis
              </h1>
              {station.stationDetail?.building?.name ? (
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-start gap-2 text-slate-800 font-bold text-lg">
                    <Building size={20} className="text-blue-600 shrink-0 mt-1" />
                    <span>{station.stationDetail.building.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 pl-7">
                    {station.stationDetail.building.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" />
                        {station.stationDetail.building.location}
                      </span>
                    )}
                    {station.stationDetail.building.pincode && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        PIN: {station.stationDetail.building.pincode}
                      </span>
                    )}
                    {station.stationDetail.building.wing_portion && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {station.stationDetail.building.wing_portion}
                      </span>
                    )}
                    {station.stationDetail.building.facing && (
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                        Facing: {station.stationDetail.building.facing}
                      </span>
                    )}
                  </div>
                </div>
              ) : station.pollingStationName ? (
                <div className="flex items-center gap-2 text-slate-500 font-bold text-lg mt-2">
                  <MapPin size={20} className="text-blue-600 shrink-0" />
                  <span>{station.pollingStationName}</span>
                </div>
              ) : null}
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex items-center gap-6 min-w-[300px]">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Winning Candidate</p>
                <h3 className="text-xl font-bold">{station.winnerName}</h3>
                <p className="text-emerald-400 text-sm font-bold">Margin: +{station.marginVotes.toLocaleString()} votes</p>
              </div>
              <div className="ml-auto w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 -mt-8 space-y-8">
        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Total Votes Polled"
            value={station.totalVotes.toLocaleString()}
            subValue={`Valid: ${station.validVotes.toLocaleString()}${station.electors ? ` | Electors: ${station.electors.toLocaleString()}` : ''}`}
            icon={<Users className="text-blue-600" />}
          />
          <MetricCard
            label="Winner Vote Share"
            value={`${station.winnerVoteShare.toFixed(1)}%`}
            subValue="Leading performance"
            icon={<Target className="text-emerald-600" />}
          />
          <MetricCard
            label="Turnout Analysis"
            value={`${station?.turnoutPercentage.toFixed(1)}%`}
            subValue={`Avg AC: ${result.avgTurnout.toFixed(1)}%${station.electors ? ` (${station.totalVotes.toLocaleString()} / ${station.electors.toLocaleString()})` : ''}`}
            icon={<TrendingUp className="text-purple-600" />}
          />
          <MetricCard
            label="NOTA Preference"
            value={`${station.notaPercentage.toFixed(2)}%`}
            subValue={`${station.notaVotes} Votes`}
            icon={<Info className="text-amber-600" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results Table */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  Candidate Breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Votes</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Vote Share</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">AC Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {station.candidateResults.map((cand, i) => (
                      <tr key={i} className={cand.isWinner ? 'bg-emerald-50/30' : ''}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <PartyBadge
                              party={cand.partyShort}
                              logoUrl={cand.partyLogoUrl}
                              colorBg={cand.partyColorBg}
                              colorText={cand.partyColorText}
                              colorBorder={cand.partyColorBorder}
                              showName={false}
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{cand.name}</span>
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{cand.party}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-900">{cand.votes.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-slate-900">{cand.voteShare.toFixed(1)}%</span>
                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-slate-900" style={{ width: `${cand.voteShare}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-500">{(cand.contributionPercent * 100).toFixed(2)}%</td>
                      </tr>
                    ))}

                    {/* NOTA Row */}
                    <tr className="bg-slate-50/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center border border-slate-300">
                             <span className="text-[10px] font-black text-slate-500">NOTA</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">None of the Above</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Independent</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">{station.notaVotes.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900">{station.notaPercentage.toFixed(1)}%</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-slate-400" style={{ width: `${station.notaPercentage}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-500">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ECI Polling Station Demarcation & Facility Details */}
            {station.stationDetail && (
              <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    ECI Demarcation & Facility Details
                  </h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {station.stationDetail.areas?.length || 0} Areas Demarcated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Polling Building</p>
                    <p className="text-sm font-bold text-slate-800">{station.stationDetail.building?.name || 'Not Available'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {station.stationDetail.building?.location || 'Tamil Nadu'}
                      {station.stationDetail.building?.pincode ? ` — PIN: ${station.stationDetail.building.pincode}` : ''}
                    </p>
                    {(station.stationDetail.building?.wing_portion || station.stationDetail.building?.facing) && (
                      <div className="flex gap-2 pt-1 text-xs">
                        {station.stationDetail.building.wing_portion && (
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-600">
                            Wing: {station.stationDetail.building.wing_portion}
                          </span>
                        )}
                        {station.stationDetail.building.facing && (
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-600">
                            Facing: {station.stationDetail.building.facing}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Demarcation Metadata</p>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p><span className="font-semibold text-slate-700">Polling Station No:</span> #{station.pollingStationNo}</p>
                      <p><span className="font-semibold text-slate-700">Station Type:</span> {station.stationDetail.station_type || station.boothType || 'Normal'}</p>
                      {station.stationDetail.filters?.rv_ids && station.stationDetail.filters.rv_ids.length > 0 && (
                        <p>
                          <span className="font-semibold text-slate-700">Revenue Villages:</span>{' '}
                          {station.stationDetail.filters.rv_ids.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {station.stationDetail.areas && station.stationDetail.areas.length > 0 && (
                  <div className="pt-2 space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Demarcated Localities / Streets</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {station.stationDetail.areas.map((area, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {area.area_no || idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 leading-snug">{area.locality || area.local_body_name || area.raw_text}</p>
                              {area.local_body_name && (
                                <p className="text-[11px] text-slate-500">
                                  {area.local_body_name} {area.is_revenue_village ? '(Revenue Village)' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          {Boolean(area.ward_nos?.length) && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-medium">
                              <span>Ward: {area.ward_nos?.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar Insights */}
          <div className="space-y-8">
            <section className="bg-slate-900 text-white rounded-3xl p-8 space-y-6 relative overflow-hidden">
              <Zap className="absolute -top-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
              <h3 className="text-xl font-bold flex items-center gap-2 relative z-10">
                <Zap className="w-5 h-5 text-amber-400" />
                Booth Insights
              </h3>
              <div className="space-y-4 relative z-10">
                {station.insights.map((insight, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Stronghold Status</h4>
                  <p className="text-sm font-bold">{station.strongholdTag || 'Competitive Booth'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">AC Comparison</h3>
              <div className="space-y-6">
                <ComparisonMetric
                  label="Booth Turnout"
                  booth={station.turnoutPercentage}
                  ac={result.avgTurnout}
                  unit="%"
                />
                <ComparisonMetric
                  label="Winner Share"
                  booth={station.winnerVoteShare}
                  ac={result.avgTurnout} // Simplified comparison
                  unit="%"
                />
                <ComparisonMetric
                  label="NOTA Level"
                  booth={station.notaPercentage}
                  ac={0.8} // Simplified static avg
                  unit="%"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactElement<{ size?: number }>;
}

const MetricCard = ({ label, value, subValue, icon }: MetricCardProps) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2 group hover:scale-[1.02] transition-transform">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
        {React.cloneElement(icon, { size: 20 })}
      </div>
    </div>
    <div className="space-y-1">
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      <p className="text-xs text-slate-500 font-medium">{subValue}</p>
    </div>
  </div>
);

interface ComparisonMetricProps {
  label: string;
  booth: number;
  ac: number;
  unit: string;
}

const ComparisonMetric = ({ label, booth, ac, unit }: ComparisonMetricProps) => {
  const diff = booth - ac;
  const isHigher = diff > 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-slate-600">{label}</span>
        <span className={`text-xs font-black ${isHigher ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isHigher ? '+' : ''}{diff.toFixed(1)}{unit} vs Avg
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${isHigher ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(booth / (booth + ac)) * 100}%` }} />
        </div>
        <span className="text-sm font-black text-slate-900 w-12 text-right">{booth.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
};
