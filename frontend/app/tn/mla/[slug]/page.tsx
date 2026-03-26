import { fetchMLAProfile } from "@/services/api";
import MLAHeader from "@/components/MLAHeader";
import HistoryTable from "@/components/HistoryTable";
import { AssetChart, VoteTrendChart, MarginTrendChart } from "@/components/AnalyticsCharts";
import { getBaseMetadata, generatePersonSchema } from "@/lib/seo";
import ConstituencyMap from "@/components/ConstituencyMap";
import { AttendanceWidget, QuestionsWidget } from "@/components/MetricWidgets";
import IncomeDetailsTable from "@/components/IncomeDetailsTable";
import ElectionExpensesWidget from "@/components/ElectionExpensesWidget";
import AssetSummaryWidget from "@/components/AssetSummaryWidget";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const profile = await fetchMLAProfile(slug);
    const name = profile.person.name;
    const latestElection = profile.history[0];
    const constituency = latestElection?.constituency || "N/A";
    const party = latestElection?.party || "Independent";

    return getBaseMetadata(
      `${name} MLA Profile | Assets, Income, Criminal Cases`,
      `View ${name} MLA profile including election history, asset growth, vote trends and criminal case record.`,
      `/tn/mla/${slug}`,
      [`${name}`, `${constituency} MLA`, `${party}`, "Tamil Nadu Politics", "MLA Assets", "Criminal Cases"]
    );
  } catch (error) {
    return getBaseMetadata(
      "MLA Profile",
      "View MLA profile details.",
      `/tn/mla/${slug}`,
      ["MLA Profile", "Tamil Nadu Politics", "Election History"]
    );
  }
}

export default async function MLAProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await fetchMLAProfile(slug);
  const latestElection = profile.history[0];
  const criminalCases = profile.analytics.criminal_case_trend.length > 0
    ? profile.analytics.criminal_case_trend[profile.analytics.criminal_case_trend.length - 1].cases
    : 0;

  const schema = generatePersonSchema(
    profile.person.name,
    latestElection?.party || "Independent",
    latestElection?.constituency || "N/A"
  );

  const latestAssets = profile.analytics.asset_growth[profile.analytics.asset_growth.length - 1]?.assets || 0;
  const totalAssetsStr = `₹ ${(latestAssets / 10000000).toFixed(2)} Cr`;

  return (
    <div className="min-h-screen bg-page-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        <nav className="flex text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          <a href="/tn" className="hover:text-brand-dark transition-colors">Home</a>
          <span className="mx-3 text-slate-300">/</span>
          <span className="text-brand-dark">{profile.person.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
                <MLAHeader
                  person={profile.person}
                  latestHistory={latestElection}
                  criminalCases={criminalCases}
                  totalAssets={totalAssetsStr}
                  winRate={profile.analytics.win_rate.win_rate}
                />
            </div>
            <div className="lg:col-span-1">
                <ConstituencyMap />
            </div>
        </div>

        {/* Performance Metrics Section */}
        <section className="bg-brand-dark rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
           
           <div className="flex justify-between items-center mb-12 relative z-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Performance Metrics</h2>
              <span className="text-[10px] bg-brand-green text-white font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-lg">Win Strength</span>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col h-full border border-white/50">
                <h3 className="text-xl font-black text-brand-dark mb-8 uppercase tracking-tight">Asset Growth</h3>
                <div className="flex-1">
                    <AssetChart data={profile.analytics.asset_growth.map((a) => ({ year: a.year, assets: a.assets }))} />
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-8 leading-relaxed opacity-70">
                   Asset Growth Trend is growing to the target levels. Much volume of ₹7.5Cr, and ₹2.5Cr manuled within 2018 our amount growth now 2021.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col h-full border border-white/50">
                <h3 className="text-xl font-black text-brand-dark mb-8 uppercase tracking-tight">Vote Share</h3>
                <div className="flex-1">
                    <VoteTrendChart data={profile.analytics.vote_trend.map((v) => ({ year: v.year, votes: v.votes }))} />
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-8 leading-relaxed opacity-70">
                   Vote Share Trend is witnessed here to grant more fans by the margin trend, red margin.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col h-full border border-white/50">
                <h3 className="text-xl font-black text-brand-dark mb-8 uppercase tracking-tight">Margin Trend</h3>
                <div className="flex-1">
                    <MarginTrendChart data={profile.analytics.margin_trend.map((m) => ({
                      year: m.year,
                      margin: m.margin,
                      margin_percent: m.margin_percent
                    }))} />
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-8 leading-relaxed opacity-70">
                   Margin Trend (Victory Strength) is percentage-becoming 45% with a clear trend icon.
                </p>
              </div>
           </div>
        </section>

        {/* Bottom Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: History and Impact Widgets */}
            <div className="lg:col-span-2 space-y-12">
                <section className="space-y-8">
                    <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Election Participation</h2>
                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-brand-dark">
                            <h3 className="text-xl font-black text-white uppercase tracking-wider">Historical Records</h3>
                            <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                                Win Rate: <span className="text-brand-light-gold">{profile.analytics.win_rate.win_rate}%</span>
                            </div>
                        </div>
                        <HistoryTable history={profile.history} />
                    </div>
                </section>

                <section className="space-y-8">
                    <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Income Details</h2>
                    <IncomeDetailsTable itrHistory={profile.analytics.itr_history} />
                </section>

                <AssetSummaryWidget 
                    goldAssets={profile.analytics.gold_assets}
                    vehicleAssets={profile.analytics.vehicle_assets}
                    landAssets={profile.analytics.land_assets}
                />

                <section className="space-y-8">
                    <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Impact Widgets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AttendanceWidget />
                        <QuestionsWidget />
                    </div>
                </section>
            </div>

            {/* Right Column: Did you know and Quick Links */}
            <aside className="space-y-12">
                <ElectionExpensesWidget expenses={profile.analytics.election_expenses_trend} />
                <section className="space-y-8">
                    <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Insights</h2>
                    <div className="space-y-8">
                        <div className="bg-brand-dark p-10 rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
                            <h3 className="text-brand-light-gold font-black uppercase tracking-[0.3em] text-[10px] mb-6">Did you know?</h3>
                            <div className="space-y-6">
                                <p className="text-white text-base leading-relaxed font-bold tracking-tight">
                                This MLA has contested in <span className="text-brand-gold underline decoration-2 underline-offset-4 font-black">{profile.analytics.win_rate.total_contested}</span> elections and won <span className="text-brand-gold underline decoration-2 underline-offset-4 font-black">{profile.analytics.win_rate.total_wins}</span> of them.
                                </p>
                                <p className="text-white text-sm leading-relaxed font-bold tracking-tight opacity-90">
                                For each year ₹3 Cr will be allocated for each MLA as a part of MLACD.{" "}
                                <a 
                                    href="https://tnrd.tn.gov.in/rdweb_newsite/project/reports/Public/public_page_table_content_details_view.php?tabular_content_id=NQ==&page_id=Ng==" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-brand-gold hover:underline decoration-1 underline-offset-2"
                                >
                                    Source
                                </a>
                                </p>
                                <p className="text-white text-sm leading-relaxed font-bold tracking-tight opacity-90">
                                Election expenditure limit is ₹40 Lakh for assembly elections.{" "}
                                <a 
                                    href="https://old.eci.gov.in/files/file/13928-limits-of-candidate%E2%80%99s-expenses-enhanced/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-brand-gold hover:underline decoration-1 underline-offset-2"
                                >
                                    Source
                                </a>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center">
                            <h3 className="text-brand-dark font-black uppercase tracking-[0.2em] text-[10px] mb-6">Internal Links</h3>
                            <ul className="space-y-6">
                                <li>
                                    <a href={`/tn/districts/${latestElection?.constituency.toLowerCase().replace(/\s+/g, '-')}`} className="text-brand-dark hover:text-brand-gold font-black text-xs flex items-center gap-3 transition-colors group">
                                    <span className="w-1.5 h-1.5 bg-brand-gold rounded-full group-hover:scale-150 transition-transform" />
                                    View all MLAs in this District
                                    </a>
                                </li>
                                <li>
                                    <a href={`/tn/constituency/${latestElection?.constituency.toLowerCase().replace(/\s+/g, '-')}`} className="text-brand-dark hover:text-brand-gold font-black text-xs flex items-center gap-3 transition-colors group">
                                        <span className="w-1.5 h-1.5 bg-brand-gold rounded-full group-hover:scale-150 transition-transform" />
                                    View {latestElection?.constituency} history
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
            </aside>
        </div>
      </main>
      

    </div>
  );
}
