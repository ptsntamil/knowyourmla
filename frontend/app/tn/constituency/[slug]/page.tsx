import Link from "next/link";
import { fetchConstituencyWinners } from "@/services/api";
import CoverImage from "@/components/CoverImage";
import ProfileImage from "@/components/ProfileImage";
import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import SEOIntro from "@/components/seo/SEOIntro";
import AnswerSnippet from "@/components/seo/AnswerSnippet";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const constituencyId = `CONSTITUENCY#${slug}`;
  const constituencyName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  
  // Fetch to get the current winner for the meta description
  const data = await fetchConstituencyWinners(constituencyId).catch(() => ({ history: [] }));
  const currentWinner = data.history[0];
  const mlaInfo = currentWinner ? `currently represented by ${currentWinner.winner} (${currentWinner.party.short_name || currentWinner.party.name})` : "check current MLA and candidates";

  return buildMetadata({
    title: `${constituencyName} MLA | Current MLA, Candidates & Election Details`,
    description: `Check the current MLA of ${constituencyName}, ${mlaInfo}, candidate list, party details, and constituency information on KnowYourMLA.`,
    path: `/tn/constituency/${slug}`,
    keywords: [`${constituencyName} Constituency`, "Election History", "Tamil Nadu MLA", "Election Results", "Tamil Nadu Politics"]
  });
}

export default async function ConstituencyPage({ params }: PageProps) {
  const { slug } = await params;
  const constituencyId = `CONSTITUENCY#${slug}`;
  const constituencyName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  const data = await fetchConstituencyWinners(constituencyId);
  const currentWinner = data.history[0]; // Assuming sorted descending by year

  const faqs = [
    {
      question: `Who is the current MLA of ${constituencyName}?`,
      answer: currentWinner 
        ? `${currentWinner.winner} from ${currentWinner.party.name} is the current MLA of ${constituencyName} constituency.`
        : `Information about the current MLA of ${constituencyName} is being updated.`
    },
    {
      question: `Which district is ${constituencyName} in?`,
      answer: `${constituencyName} is a legislative assembly constituency in Tamil Nadu.`
    },
    {
      question: `What is the voter turnout in ${constituencyName}?`,
      answer: data.stats && data.stats.length > 0 
        ? `In the latest elections, the voter turnout in ${constituencyName} was ${data.stats[0].poll_percentage}%.`
        : `Historical voter turnout data for ${constituencyName} is available in the statistics section above.`
    },
    {
      question: `Where can I find the election history of ${constituencyName}?`,
      answer: `The complete election history, including past winners and party performance for ${constituencyName}, is listed on this page.`
    }
  ];

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
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <SEOIntro 
          h1={`${constituencyName} Assembly Constituency`}
          intro={`${constituencyName} is a Tamil Nadu Assembly constituency. This page includes the current MLA, candidate list, party details, election-related information, and constituency profile.`}
        />

        {currentWinner && (
          <AnswerSnippet 
            question={`Who is the current MLA of ${constituencyName}?`}
            answer={`${currentWinner.winner} is the current MLA of ${constituencyName} constituency, elected in the ${currentWinner.year} Tamil Nadu Assembly elections.`}
          />
        )}

        {currentWinner && (
          <section>
            <div className="mb-8">
                <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Current Representative</h2>
            </div>
            
            <div className="bg-brand-green rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-10 relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              
              <div className="w-40 h-40 md:w-48 md:h-48 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-8 border-white/10 shadow-2xl flex-shrink-0 z-10">
                <ProfileImage 
                  src={currentWinner.profile_pic} 
                  alt={currentWinner.winner} 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="flex-1 text-center md:text-left z-10 space-y-8">
                <div className="space-y-4">
                  <div className="text-brand-gold font-black uppercase tracking-[0.3em] text-[10px] mb-2">Incumbent MLA</div>
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">{currentWinner.winner}</h2>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                    <div 
                      className="px-6 py-2.5 rounded-full border shadow-lg flex items-center gap-3 transition-colors"
                      style={{
                        backgroundColor: currentWinner.party.color_bg || '#D4AF37',
                        color: currentWinner.party.color_text || '#FFFFFF',
                        borderColor: currentWinner.party.color_border || 'rgba(255,255,255,0.1)'
                      }}
                    >
                      {currentWinner.party.logo_url && (
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                          <img src={currentWinner.party.logo_url} alt={currentWinner.party.name || ""} className="w-7 h-7 object-contain" />
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] opacity-70 uppercase font-black leading-none mb-1">Party</p>
                        <p className="font-black text-xs uppercase tracking-wider leading-none">
                          {currentWinner.party.short_name || currentWinner.party.name}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/10 text-white px-5 py-2 rounded-full border border-white/10">
                      <p className="text-[9px] text-white/50 uppercase font-black leading-none mb-1">Elected</p>
                      <p className="font-black text-xs uppercase tracking-wider leading-none">{currentWinner.year}</p>
                    </div>
                    <div className="bg-white/10 text-white px-5 py-2 rounded-full border border-white/10">
                      <p className="text-[9px] text-white/50 uppercase font-black leading-none mb-1">Margin</p>
                      <p className="font-black text-xs uppercase tracking-wider leading-none" suppressHydrationWarning>+{currentWinner.margin.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <Link
                  href={`/tn/mla/${currentWinner.person_id ? currentWinner.person_id.replace("PERSON#", "") : currentWinner.winner.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  className="inline-flex items-center gap-3 bg-brand-gold text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-yellow transition-all shadow-2xl transform hover:scale-105"
                >
                  View Full Profile
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

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

        <section>
          <div className="mb-8">
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Election History</h2>
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
                        <span 
                          className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 w-fit border shadow-sm transition-colors"
                          style={{
                            backgroundColor: record.party.color_bg || 'rgba(15, 23, 42, 0.05)',
                            color: record.party.color_text || '#0F172A',
                            borderColor: record.party.color_border || 'rgba(15, 23, 42, 0.1)'
                          }}
                        >
                          {record.party.logo_url && (
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner">
                              <img src={record.party.logo_url} alt={record.party.name || ""} className="w-6 h-6 object-contain" />
                            </div>
                          )}
                          {record.party.short_name || record.party.name}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right font-black text-slate-400" suppressHydrationWarning>{record.margin.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
