import { fetchMLAProfile } from "@/services/api";
import { headers } from "next/headers";
import Link from "next/link";
import MLAHeader from "@/components/MLAHeader";
import HistoryTable from "@/components/HistoryTable";
import { AssetChart, VoteTrendChart, MarginTrendChart } from "@/components/AnalyticsCharts";
import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import { generatePersonSchema } from "@/lib/seo/jsonld";
import SEOIntro from "@/components/seo/SEOIntro";
import AnswerSnippet from "@/components/seo/AnswerSnippet";
import FAQSection from "@/components/seo/FAQSection";
import FAQSchema from "@/components/seo/FAQSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import JsonLd from "@/components/seo/JsonLd";
import { AttendanceWidget, QuestionsWidget } from "@/components/MetricWidgets";
import IncomeDetailsTable from "@/components/IncomeDetailsTable";
import ElectionExpensesWidget from "@/components/ElectionExpensesWidget";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const profile = await fetchMLAProfile(slug);
    const name = profile.person.name;
    const latestElection = profile.history[0];
    const isWinner = latestElection?.winner === true;
    const isCurrent = latestElection?.year === 2021 && isWinner;
    const constituency = latestElection?.constituency || "N/A";
    const party = latestElection?.party || "Independent";

    const titleSuffix = isCurrent ? "MLA Profile" : "Candidate Profile";
    const seoDescription = isCurrent
      ? `View ${name} MLA profile from ${constituency} constituency including election history, asset growth, vote share trends and criminal records on KnowYourMLA.`
      : `View ${name} political profile and election history from ${constituency} constituency. Explore asset declarations, vote share trends and criminal records on KnowYourMLA.`;

    return buildMetadata({
      title: `${name} ${titleSuffix} | Assets, Income, Criminal Cases`,
      description: seoDescription,
      path: `/tn/mla/${slug}`,
      keywords: [`${name}`, `${constituency} ${isCurrent ? 'MLA' : 'Candidate'}`, `${party}`, "Tamil Nadu Politics", "MLA Assets", "Criminal Cases"]
    });
  } catch (error) {
    return buildMetadata({
      title: "MLA Profile",
      description: "View detailed MLA profile including political history and assets.",
      path: `/tn/mla/${slug}`
    });
  }
}

export default async function MLAProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await fetchMLAProfile(slug);
  const latestElection = profile.history?.[0];
  const isWinner = latestElection?.winner === true;
  const isCurrent = latestElection?.year === 2021 && isWinner;
  const isFormer = !isCurrent && profile.history.some((h: any) => h.winner === true);

  const personalTitle = isCurrent ? "MLA" : (isFormer ? "Former MLA" : "Candidate");

  const criminalCases = profile.analytics?.criminal_case_trend?.length > 0
    ? profile.analytics.criminal_case_trend[profile.analytics.criminal_case_trend.length - 1].cases
    : 0;

  const latestAssets = profile.analytics?.asset_growth?.length > 0
    ? profile.analytics.asset_growth[profile.analytics.asset_growth.length - 1]?.assets
    : 0;
  const totalAssetsStr = `₹ ${(latestAssets / 10000000).toFixed(2)} Cr`;

  const constituency = latestElection?.constituency || "N/A";
  const party = latestElection?.party || "Independent";

  const faqs = [
    {
      question: isCurrent ? `Who is the current MLA of ${constituency}?` : `Who contested from ${constituency} in ${latestElection?.year}?`,
      answer: isCurrent
        ? `${profile.person.name} is the current MLA of ${constituency} constituency.`
        : `${profile.person.name} contested from the ${constituency} constituency in the ${latestElection?.year} elections.`
    },
    {
      question: `Which district is ${constituency} in?`,
      answer: `${constituency} assembly constituency is part of the ${latestElection?.district_name || 'legislative assembly'} district in Tamil Nadu.`
    },
    {
      question: isCurrent ? `What is the constituency profile of ${constituency}?` : `Who was the ${party} candidate for ${constituency}?`,
      answer: isCurrent
        ? `The constituency of ${constituency} is represented by ${profile.person.name} of ${party}. Detailed historical data and performance metrics are available on this page.`
        : `${profile.person.name} was the ${party} candidate for the ${constituency} constituency. Detailed election history and candidate metrics are available on this page.`
    }
  ];

  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const isFromParty = referer.includes("/parties/") || referer.includes("/party/");

  const districtSlug = latestElection?.district_name?.toLowerCase().replace(/\s+/g, '-');
  const constituencySlug = latestElection?.constituency.toLowerCase().replace(/\s+/g, '-');
  const partySlug = latestElection?.party.toLowerCase().replace(/\s+/g, '-');

  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "TN", item: "/tn" },
  ];

  if (isFromParty) {
    breadcrumbItems.push({ name: party, item: `/parties/${partySlug}` });
  } else {
    if (latestElection?.district_name) {
      breadcrumbItems.push({ name: latestElection.district_name, item: `/tn/districts/${districtSlug}` });
    }
    breadcrumbItems.push({ name: constituency, item: `/tn/constituency/${constituencySlug}` });
  }

  breadcrumbItems.push({ name: profile.person.name, item: `/tn/mla/${slug}` });

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={breadcrumbItems}
      />
      <JsonLd
        data={generatePersonSchema({
          name: profile.person.name,
          party: party,
          constituency: constituency,
          image: profile.person.image_url
        })}
      />

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        <nav className="flex items-center flex-wrap gap-y-2 text-xs md:text-[13px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {breadcrumbItems.map((item, index) => (
            <div key={`${item.item}-${index}`} className="flex items-center">
              {index > 0 && <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-brand-dark dark:text-brand-light-gold font-black">{item.name}</span>
              ) : (
                <a href={item.item} className="hover:text-brand-gold dark:hover:text-brand-light-gold transition-all active:scale-95 px-2 py-1 -ml-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
                  {item.name}
                </a>
              )}
            </div>
          ))}
        </nav>

        <div className="w-full">
          <MLAHeader
            person={profile.person}
            latestHistory={latestElection}
            criminalCases={criminalCases}
            totalAssets={totalAssetsStr}
            winRate={profile.analytics.win_rate.win_rate}
            goldAssets={profile.analytics.gold_assets}
            vehicleAssets={profile.analytics.vehicle_assets}
            landAssets={profile.analytics.land_assets}
            personalTitle={personalTitle}
          />
        </div>

        <div className="space-y-8">
          <SEOIntro
            h1={`${profile.person.name} ${personalTitle} Profile - ${constituency}`}
            intro={`${profile.person.name} ${isCurrent ? 'is the current representative for' : (isFormer ? 'is a former MLA who contested for' : 'was a candidate for')} the ${constituency} Assembly constituency in Tamil Nadu. This page provides a comprehensive look at their political career, election history, assets, income details, and performance metrics.`}
          />

          <AnswerSnippet
            question={isCurrent ? `Who is the current MLA of ${constituency}?` : `Who is ${profile.person.name}?`}
            answer={isCurrent
              ? `${profile.person.name} is the incumbent MLA of ${constituency} constituency, representing the ${party} party.`
              : `${profile.person.name} is a political candidate who represented ${party} in the ${constituency} constituency.`}
          />
        </div>

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
                Visualize the growth of assets declared by {profile.person.name} across different election cycles.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col h-full border border-white/50">
              <h3 className="text-xl font-black text-brand-dark mb-8 uppercase tracking-tight">Vote Share</h3>
              <div className="flex-1">
                 <VoteTrendChart data={profile.analytics.vote_trend.map((v) => ({ year: v.year, votes: v.votes, vote_percent: v.vote_percent }))} />
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-8 leading-relaxed opacity-70">
                Tracking the popularity and support received by the candidate in various elections.
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
                The margin of victory indicates the relative strength of the candidate against opponents.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
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

            <section className="space-y-8">
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Impact Widgets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AttendanceWidget />
                <QuestionsWidget />
              </div>
            </section>
          </div>

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
                      This {personalTitle === "MLA" ? "MLA" : "candidate"} has contested in <span className="text-brand-gold underline decoration-2 underline-offset-4 font-black">{profile.analytics.win_rate.total_contested}</span> elections and won <span className="text-brand-gold underline decoration-2 underline-offset-4 font-black">{profile.analytics.win_rate.total_wins}</span> of them.
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
                      <a href={`/tn/constituency/${latestElection?.constituency.toLowerCase()}`} className="text-brand-dark dark:text-slate-600 hover:text-brand-gold dark:hover:text-brand-gold font-black text-sm flex items-center gap-3 transition-all active:translate-x-1 py-1 group outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded px-2 -ml-2">
                        <span className="w-1.5 h-1.5 bg-brand-gold rounded-full group-hover:scale-150 transition-transform" />
                        View {latestElection?.constituency} history
                      </a>
                    </li>
                    <li>
                      <a href={`/tn/elections/${latestElection?.year || 2021}/insights`} className="text-brand-dark dark:text-slate-600 hover:text-brand-gold dark:hover:text-brand-gold font-black text-sm flex items-center gap-3 transition-all active:translate-x-1 py-1 group outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded px-2 -ml-2">
                        <span className="w-1.5 h-1.5 bg-brand-gold rounded-full group-hover:scale-150 transition-transform" />
                        Explore {latestElection?.year || 2021} Insights
                      </a>
                    </li>
                    <li>
                      <a href={`/parties/${partySlug}`} className="text-brand-dark dark:text-slate-600 hover:text-brand-gold dark:hover:text-brand-gold font-black text-sm flex items-center gap-3 transition-all active:translate-x-1 py-1 group outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded px-2 -ml-2">
                        <span className="w-1.5 h-1.5 bg-brand-gold rounded-full group-hover:scale-150 transition-transform" />
                        View all {party} MLAs
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </aside>
        </div>


        <div className="bg-brand-dark rounded-[3rem] p-10 mt-20 mb-20 relative overflow-hidden group shadow-2xl shadow-brand-dark/20 text-center sm:text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Election Intelligence</h3>
              <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
                How does {profile.person.name}'s performance compare to the statewide benchmarks? 
                Explore the full 2021 assembly election analysis to see detailed insights across all constituencies.
              </p>
            </div>
            <Link 
              href="/tn/elections/2021/insights"
              className="bg-brand-gold text-brand-dark font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:scale-105 transition-all shadow-xl shadow-black/20 shrink-0"
            >
              Explore 2021 Insights
            </Link>
          </div>
        </div>

        <section className="mt-18 pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
