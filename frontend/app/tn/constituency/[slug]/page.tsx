import Link from "next/link";
import { fetchConstituencyWinners } from "@/services/api";
import CoverImage from "@/components/CoverImage";
import { buildMetadata } from "@/lib/seo/metadata";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import MLASnapshotCard from "@/components/constituency/MLASnapshotCard";
import ConstituencyInsights from "@/components/constituency/ConstituencyInsights";
import PartyBadge from "@/components/ui/PartyBadge";
import { getConstituencyPreElectionOverlayData } from "@/lib/elections/preElectionDashboard/getConstituencyPreElectionOverlayData";
import ConstituencyPreElectionOverlay from "@/components/election/dashboard/ConstituencyPreElectionOverlay";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const constituencyId = `CONSTITUENCY#${slug}`;
  const constituencyName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const showPreElection = process.env.NEXT_PUBLIC_ENABLE_2026_PRE_ELECTION === "true";

  // Fetch both historical and pre-election data for SEO
  const [data, overlay] = await Promise.all([
    fetchConstituencyWinners(constituencyId).catch(() => ({ history: [] })),
    showPreElection ? getConstituencyPreElectionOverlayData(slug) : Promise.resolve(null)
  ]);

  const currentWinner = data.history[0];
  const mlaInfo = currentWinner ? `currently represented by ${currentWinner.winner} (${currentWinner.party.short_name || currentWinner.party.name})` : "check current MLA and candidates";

  let title = `${constituencyName} MLA | Current MLA, Candidates & Election Details`;
  let description = `Check the current MLA of ${constituencyName}, ${mlaInfo}, candidate list, party details, and constituency information on KnowYourMLA.`;
  let keywords = [`${constituencyName} Constituency`, "Election History", "Tamil Nadu MLA", "Election Results", "Tamil Nadu Politics"];

  if (showPreElection) {
    const electionContext = overlay?.has2026Candidates
      ? `${overlay.candidateCount} candidates announced for 2026 election.`
      : "2026 election candidate announcements expected soon.";

    title = `${constituencyName} MLA | 2026 Candidates, Current MLA & Election Details`;
    description = `Check the current MLA of ${constituencyName}, ${mlaInfo}. ${electionContext} Explore 2026 candidate list, party details, and constituency information on KnowYourMLA.`;
    keywords = [
      ...keywords,
      `${constituencyName} 2026 candidates`,
      "Election Results 2026"
    ];
  }

  return buildMetadata({
    title,
    description,
    path: `/tn/constituency/${slug}`,
    keywords
  });
}

export default async function ConstituencyPage({ params }: PageProps) {
  const { slug } = await params;
  const constituencyId = `CONSTITUENCY#${slug}`;
  const constituencyName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  // Parallel fetch for history and pre-election overlay (if enabled)
  const showPreElection = process.env.NEXT_PUBLIC_ENABLE_2026_PRE_ELECTION === "true";

  const [data, overlayData] = await Promise.all([
    fetchConstituencyWinners(constituencyId),
    showPreElection ? getConstituencyPreElectionOverlayData(slug) : Promise.resolve(null)
  ]);

  const currentWinner = data.history[0]; // Assuming sorted descending by year
  const latestVoterTurnout = data.stats?.find((stat: any) => parseFloat(stat.poll_percentage) > 0);

  const standardFaqs = [
    {
      question: `Who is the current MLA of ${constituencyName}?`,
      answer: currentWinner
        ? `${currentWinner.winner} from ${currentWinner.party.name} is the current MLA of ${constituencyName} constituency.`
        : `Information about the current MLA of ${constituencyName} is being updated.`
    },
    {
      question: `What is the voter turnout in ${constituencyName}?`,
      answer: latestVoterTurnout
        ? `In the ${latestVoterTurnout.year} elections, the voter turnout in ${constituencyName} was ${latestVoterTurnout.poll_percentage}%.`
        : `Historical voter turnout data for ${constituencyName} is available in the statistics section above.`
    }
  ];

  const electionFaqs = showPreElection ? [
    {
      question: `Who are the 2026 candidates in ${constituencyName}?`,
      answer: overlayData?.has2026Candidates
        ? `There are ${overlayData.candidateCount} candidates announced for ${constituencyName} in the 2026 Tamil Nadu Election, including nominees from ${overlayData.insights.majorParties.join(', ')}.`
        : `Candidate announcements for the 2026 Tamil Nadu Assembly Election in ${constituencyName} are currently awaited. Party nominations are expected to be released soon.`
    },
    {
      question: `Is the current MLA contesting again in ${constituencyName}?`,
      answer: overlayData?.overlayStatus === 'live'
        ? (overlayData.contestSummary?.isIncumbentRecontest
          ? `Yes, the incumbent MLA from ${constituencyName} is re-contesting in the 2026 election.`
          : `No, based on current announcements, the incumbent MLA is not in the candidate lineup for ${constituencyName} in 2026.`)
        : `Whether the current MLA is re-contesting in ${constituencyName} will be confirmed once all party candidate lists for 2026 are released.`
    }
  ] : [];

  const faqs = [...standardFaqs, ...electionFaqs];

  const districtName = data.district_name;
  const districtSlug = data.district_id?.replace("DISTRICT#", "").toLowerCase() ||
    districtName?.toLowerCase().replace(/\s+/g, '-');

  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "TN", item: "/tn" },
  ];

  if (districtName) {
    breadcrumbItems.push({ name: districtName, item: `/tn/districts/${districtSlug}` });
  }

  breadcrumbItems.push({ name: constituencyName, item: `/tn/constituency/${slug}` });

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={breadcrumbItems}
      />

      <CoverImage
        title={`${slug}`}
        subtitle={`Historical election data and representative details for the ${slug} constituency.`}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <nav className="flex items-center flex-wrap gap-y-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-3 text-white/20">/</span>
            <Link href="/tn" className="hover:text-white transition-colors">TN</Link>
            <span className="mx-3 text-white/20">/</span>
            {districtName && (
              <>
                <Link href={`/tn/districts/${districtSlug}`} className="hover:text-white transition-colors">{districtName}</Link>
                <span className="mx-3 text-white/20">/</span>
              </>
            )}
            <span className="text-brand-gold">{slug}</span>
          </nav>

          <div className="flex items-center justify-end gap-4">
            <ShareButton
              title={`${constituencyName} Constituency Profile | KnowYourMLA`}
              text={currentWinner 
                ? `Explore ${constituencyName} constituency, current MLA ${currentWinner.winner} (${currentWinner.party.short_name}), election history, and candidates on KnowYourMLA.`
                : `Explore ${constituencyName} constituency election history, candidate details, and political insights on KnowYourMLA.`}
              url={`/tn/constituency/${slug}`}
              label="Share"
            />
          </div>
        </div>
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-16">
        {/* Section 0: 2026 Pre-Election Overlay */}
        {overlayData && (
          <section className="scroll-mt-32" id="pre-election-2026">
            <ConstituencyPreElectionOverlay data={overlayData} />
          </section>
        )}

        {currentWinner && (
          <div className="pt-16 border-t border-slate-100">
            {/* <div className="mb-10">
              <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight italic">Current Representation</h2>
            </div> */}
            <MLASnapshotCard
              mla={currentWinner}
              constituencyName={`${constituencyName} Constituency`}
            />
          </div>
        )}

        <ConstituencyInsights
          history={data.history}
          stats={data.stats}
        />

        {data.stats && data.stats.length > 0 && (
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Election Statistics</h2>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-10 py-8 bg-brand-gold flex justify-between items-center text-white">
                  <h3 className="font-black uppercase tracking-widest text-sm">Voter Turnout & Elector Data</h3>
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Historical Data</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Electors</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Votes Polled</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Poll%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.stats.map((stat: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-10 py-8 font-black text-brand-dark">{stat.year}</td>
                          <td className="px-10 py-8 font-black text-slate-600" suppressHydrationWarning>{stat.total_electors.toLocaleString()}</td>
                          <td className="px-10 py-8 font-black text-slate-600" suppressHydrationWarning>{stat.total_votes_polled.toLocaleString()}</td>
                          <td className="px-10 py-8 text-right font-black text-brand-green">{stat.poll_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.stats[0]?.male !== undefined && (
                (() => {
                  const latest = data.stats[0];
                  return (
                    <div className="lg:col-span-1 bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm p-10 space-y-10">
                      <div className="space-y-2">
                        <h3 className="font-black text-brand-dark uppercase tracking-widest text-sm">Gender Distribution</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Latest Data ({latest.year})</p>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male</span>
                            <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latest.male?.toLocaleString()}</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-dark rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${((latest.male || 0) / latest.total_electors) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female</span>
                            <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latest.female?.toLocaleString()}</span>
                          </div>
                          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-gold rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${((latest.female || 0) / latest.total_electors) * 100}%` }}
                            />
                          </div>
                        </div>

                        {latest.third_gender !== undefined && latest.third_gender > 0 && (
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Others</span>
                              <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latest.third_gender.toLocaleString()}</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(latest.third_gender / latest.total_electors) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-50">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Electors</span>
                          <span className="text-lg font-black text-brand-green" suppressHydrationWarning>{latest.total_electors.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </section>
        )}

        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Election History</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Past winners and performance in {slug}</p>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-10 py-8 bg-brand-dark flex justify-between items-center text-white">
              <h3 className="font-black uppercase tracking-widest text-sm">Past Winners List</h3>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Tamil Nadu Elections</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Winner</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Party</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.history.map((record: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-10 py-8 font-black text-brand-dark">{record.year}</td>
                      <td className="px-10 py-8">
                        {record.person_id || record.slug ? (
                          <Link
                            href={`/tn/mla/${record.person_id ? record.person_id.replace("PERSON#", "") : record.slug}`}
                            className="font-black text-brand-gold hover:text-brand-green uppercase tracking-tight text-lg"
                          >
                            {record.winner}
                          </Link>
                        ) : (
                          <span className="font-black text-slate-300 uppercase tracking-tight text-lg italic">
                            {record.winner}
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <PartyBadge
                          party={record.party.short_name || record.party.name}
                          logoUrl={record.party.logo_url}
                          colorBg={record.party.color_bg || 'rgba(15, 23, 42, 0.05)'}
                          colorText={record.party.color_text || '#0F172A'}
                          colorBorder={record.party.color_border || 'rgba(15, 23, 42, 0.1)'}
                        />
                      </td>
                      <td className="px-10 py-8 text-right font-black text-slate-400" suppressHydrationWarning>{record.margin.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>


        <div className="bg-brand-dark rounded-[3rem] p-10 mt-20 mb-20 relative overflow-hidden group shadow-2xl shadow-brand-dark/20 text-center sm:text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Election Intelligence</h3>
              <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
                How does {slug} compare to the statewide trends? 
                Explore the full 2021 assembly election analysis to see performance across all 234 seats, regional patterns, and candidate analytics.
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

        <section className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
