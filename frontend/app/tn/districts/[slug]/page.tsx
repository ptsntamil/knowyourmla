import Link from "next/link";
import { fetchConstituencies, fetchDistrictDetails, fetchDistrictInsights } from "@/services/api";
import ConstituencyList from "@/components/ConstituencyList";
import CoverImage from "@/components/CoverImage";
import DistrictInsights from "@/components/district/DistrictInsights";
import DistrictElectorate from "@/components/district/DistrictElectorate";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import SEOIntro from "@/components/seo/SEOIntro";
import AnswerSnippet from "@/components/seo/AnswerSnippet";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";
import ShareButton from "@/components/ShareButton";

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

  // Fetch insights to determine the best OG image type
  const { insights } = await fetchDistrictInsights(districtId).catch(() => ({ insights: null }));
  const ogType = (insights && insights.dominantParty && insights.dominantParty.party) ? 'dominant-party' : 'profile';
  const ogImage = `/og/district/${slug.toLowerCase()}/${ogType}`;

  return buildMetadata({
    title: `${districtName} District MLA List | Constituencies, MLAs & Party Details`,
    description: `View the complete ${districtName} district MLA list with ${count} constituency names, current MLAs, party details, and candidate information on KnowYourMLA.`,
    path: `/tn/districts/${slug}`,
    image: ogImage,
    keywords: [`${districtName} District`, "Tamil Nadu Politics", "MLA List", "Constituency Details", "Tamil Nadu Election"]
  });
}

export default async function DistrictPage({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const districtId = `DISTRICT#${normalizedSlug}`;
  const districtNameDisplay = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const [constituencies, districtDetails, insightsResponse] = await Promise.all([
    fetchConstituencies(districtId),
    fetchDistrictDetails(districtId),
    fetchDistrictInsights(districtId)
  ]);

  const { insights, mlas } = insightsResponse;

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <nav className="flex items-center flex-wrap gap-y-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-3 text-white/20">/</span>
            <Link href="/tn" className="hover:text-white transition-colors">TN</Link>
            <span className="mx-3 text-white/20">/</span>
            <span className="text-brand-gold">{slug}</span>
          </nav>

          <div className="flex items-center justify-end gap-4">
            <ShareButton
              title={`${districtNameDisplay} District Political Profile | KnowYourMLA`}
              text={`Explore ${districtNameDisplay} district political profile, MLA insights, dominant party, women representation and more on KnowYourMLA.`}
              url={`/tn/districts/${slug}`}
              label="Share"
            />
          </div>
        </div>
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

        {/* District Insights & Electorate Section */}
        <section className="space-y-12">
          <SectionHeader
            title="District Insights"
            subtitle="Quick political and representative insights from the current MLAs and electorate of this district."
          />
          <div className="grid lg:grid-cols-10 gap-12 items-start">
            <div className="lg:col-span-7">
              <DistrictInsights insights={insights} mlas={mlas} />
            </div>
            <div className="lg:col-span-3 h-full">
              {latestStats && (latestStats.male !== undefined || latestStats.total_electors > 0) ? (
                <DistrictElectorate
                  year={latestStats.year}
                  total_electors={latestStats.total_electors}
                  male={latestStats.male}
                  female={latestStats.female}
                  third_gender={latestStats.third_gender}
                />
              ) : (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-10 flex flex-col items-center justify-center text-center opacity-50 h-full">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Electorate data unavailable</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Constituencies Section */}
        <div className="pt-24 border-t border-slate-100 dark:border-slate-800 space-y-12">
          <div>
            <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-2">Constituencies</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legislative segments within {slug} district</p>
          </div>
          <ConstituencyList constituencies={constituencies} mlas={mlas} />
        </div>

        <div className="bg-brand-dark rounded-[3rem] p-10 mt-20 mb-20 relative overflow-hidden group shadow-2xl shadow-brand-dark/20 text-center sm:text-left">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Election Intelligence</h3>
              <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
                How does {slug} compare to the rest of Tamil Nadu?
                Explore the full 2021 assembly election analysis to see district-level strongholds, competitive battles, and participation trends.
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

        <div className="pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </div>
      </main>
    </div>
  );
}
