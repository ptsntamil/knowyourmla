import Link from "next/link";
import { fetchConstituencies, fetchDistrictDetails } from "@/services/api";
import ConstituencyList from "@/components/ConstituencyList";
import CoverImage from "@/components/CoverImage";
import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import SEOIntro from "@/components/seo/SEOIntro";
import AnswerSnippet from "@/components/seo/AnswerSnippet";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const districtName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  const districtId = `DISTRICT#${slug.toLowerCase()}`;
  
  // Fetch for dynamic data in metadata (e.g. constituency count)
  // Next.js dedupes this call with the one in the component
  const constituencies = await fetchConstituencies(districtId).catch(() => []);
  const count = constituencies.length;

  return buildMetadata({
    title: `${districtName} District MLA List | Constituencies, MLAs & Party Details`,
    description: `View the complete ${districtName} district MLA list with ${count} constituency names, current MLAs, party details, and candidate information on KnowYourMLA.`,
    path: `/tn/districts/${slug}`,
    keywords: [`${districtName} District`, "Tamil Nadu Politics", "MLA List", "Constituency Details", "Tamil Nadu Election"]
  });
}

export default async function DistrictPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const districtId = `DISTRICT#${normalizedSlug}`;
  const districtNameDisplay = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const [constituencies, districtDetails] = await Promise.all([
    fetchConstituencies(districtId),
    fetchDistrictDetails(districtId)
  ]);

  const latestStats = districtDetails.stats && districtDetails.stats.length > 0 ? districtDetails.stats[0] : null;

  const faqs = [
    {
      question: `How many MLAs are there in ${districtNameDisplay} district?`,
      answer: `${districtNameDisplay} district has ${constituencies.length} Assembly constituencies, each represented by one MLA.`
    },
    {
      question: `What is the total voter population in ${districtNameDisplay}?`,
      answer: latestStats
        ? `As per the latest records (${latestStats.year}), the total electorate in ${districtNameDisplay} district is ${latestStats.total_electors.toLocaleString()} voters.`
        : `The total voter population for ${districtNameDisplay} district is aggregated from its ${constituencies.length} assembly constituencies.`
    },
    {
      question: `Which constituencies are in ${districtNameDisplay} district?`,
      answer: `The constituencies in ${districtNameDisplay} district include ${constituencies.slice(0, 5).map(c => c.name).join(', ')}${constituencies.length > 5 ? ' and others.' : '.'}`
    },
    {
      question: `Who are the current MLAs in ${districtNameDisplay} district?`,
      answer: `You can find the list of current MLAs for all ${constituencies.length} constituencies in ${districtNameDisplay} district on this page with their party and profile details.`
    },
    {
      question: `Where can I view the ${districtNameDisplay} district MLA list with photos?`,
      answer: `The complete ${districtNameDisplay} district MLA list with photos, party affiliations, and constituency details is available right here on KnowYourMLA.`
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema 
        items={[
          { name: "Home", item: "/" },
          { name: "TN", item: "/tn" },
          { name: districtNameDisplay, item: `/tn/districts/${slug}` }
        ]} 
      />
      <ItemListSchema 
        items={constituencies.map((c) => ({
          name: c.name,
          url: `/tn/constituency/${c.id.replace('CONSTITUENCY#', '').toLowerCase()}`
        }))}
      />

      <CoverImage
        title={`${slug} District`}
        subtitle={`Total of ${constituencies.length} legislative constituencies representing the people of ${slug}.`}
      >
        <nav className="flex items-center flex-wrap gap-y-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-3 text-white/20">/</span>
          <Link href="/tn" className="hover:text-white transition-colors">TN</Link>
          <span className="mx-3 text-white/20">/</span>
          <span className="text-brand-gold">{slug}</span>
        </nav>
      </CoverImage>

      <main className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        <SEOIntro
          h1={`${districtNameDisplay} District MLA List`}
          intro={`${districtNameDisplay} district has ${constituencies.length} Tamil Nadu Assembly constituencies${latestStats ? ` with a total electorate of approximately ${latestStats.total_electors.toLocaleString()} voters` : ''}. This page provides the complete MLA list for ${districtNameDisplay} district, including constituency names, current MLAs, party details, candidate information, and profile links.`}
        />

        <AnswerSnippet
          question={`How many MLAs and voters are there in ${districtNameDisplay} district?`}
          answer={`${districtNameDisplay} district has ${constituencies.length} Assembly constituencies in Tamil Nadu, and each constituency elects one MLA. ${latestStats ? `The total electorate in the district is ${latestStats.total_electors.toLocaleString()} voters based on the ${latestStats.year} data.` : ''}`}
        />

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Constituencies</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legislative segments within {slug} district</p>
            </div>
            <ConstituencyList constituencies={constituencies} />
          </div>

          {latestStats && (latestStats.male !== undefined || latestStats.total_electors > 0) && (
            <div className="lg:col-span-1 bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm p-10 space-y-10 lg:sticky lg:top-8">
              <div className="space-y-2">
                <h3 className="font-black text-brand-dark uppercase tracking-widest text-sm">District Electorate</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aggregated Data ({latestStats.year})</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male</span>
                    <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latestStats.male?.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-dark rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((latestStats.male || 0) / latestStats.total_electors) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female</span>
                    <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latestStats.female?.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-gold rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((latestStats.female || 0) / latestStats.total_electors) * 100}%` }}
                    />
                  </div>
                </div>

                {latestStats.third_gender !== undefined && latestStats.third_gender > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Others</span>
                      <span className="text-sm font-black text-brand-dark" suppressHydrationWarning>{latestStats.third_gender.toLocaleString()}</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(latestStats.third_gender / latestStats.total_electors) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Electors</span>
                  <span className="text-lg font-black text-brand-green" suppressHydrationWarning>{latestStats.total_electors.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed text-center">
                  This chart represents the combined voter population across all {constituencies.length} constituencies in the district.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}
