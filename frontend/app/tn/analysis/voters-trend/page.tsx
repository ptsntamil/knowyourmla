import { Metadata } from "next";
import { VoterTrendService } from "@/lib/services/voter-trend.service";
import { buildMetadata } from "@/lib/seo/metadata";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo/jsonld";
import { VoterTrendClient } from "./components/VoterTrendClient";
import Script from "next/script";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const TITLE = "Tamil Nadu Constituency-wise Votes Polled Comparison (2021 vs 2026) | KnowYourMLA";
const DESCRIPTION = "Compare constituency-wise actual votes polled, total votes added, and vote growth percentages between the 2021 and 2026 Tamil Nadu Assembly elections.";
const PATH = "/tn/analysis/voters-trend";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

export default async function VotersTrendPage() {
  const service = new VoterTrendService();
  const data = await service.getVoterTrendAnalysis();

  const breadcrumbItems = [
    { name: "Home", item: "/tn" },
    { name: "Analysis", item: "/tn/analysis" },
    { name: "Votes Polled Comparison", item: PATH }
  ];

  const faqs = [
    {
      question: "What is 'Votes Added'?",
      answer: "Votes Added is the absolute difference between the total valid votes polled in the 2026 election and the 2021 election for a given constituency. This accounts for actual voter participation growth, rather than just percentage turnout which can fluctuate due to electorate size changes."
    },
    {
      question: "Which Tamil Nadu constituency had the highest increase in actual votes in 2026?",
      answer: data.insights.top_added_votes_constituencies.length > 0 
        ? `${data.insights.top_added_votes_constituencies[0].name} had the highest increase, adding ${data.insights.top_added_votes_constituencies[0].additional_votes.toLocaleString('en-IN')} more votes compared to 2021.`
        : "Data is currently being calculated."
    },
    {
      question: "How does the total 2026 voter participation compare with 2021?",
      answer: `Overall in Tamil Nadu, there were ${data.insights.statewide_votes_added.toLocaleString('en-IN')} ${data.insights.statewide_votes_added >= 0 ? 'more' : 'fewer'} votes polled in 2026 compared to 2021.`
    },
    {
      question: "Which district recorded the most new votes polled?",
      answer: data.district_summaries.length > 0
        ? `${[...data.district_summaries].sort((a,b) => b.total_votes_added - a.total_votes_added)[0].district_name} district recorded the highest total increase in votes polled.`
        : "Data is currently being processed."
    }
  ];

  // Dynamic Content Generation
  const totalConstituencies = data.constituencies.length;
  const highestVoteGrowth = data.insights.top_vote_growth_constituencies[0];
  const largestAddedVotes = data.insights.top_added_votes_constituencies[0];
  const sortedDistricts = [...data.district_summaries].sort((a, b) => b.total_votes_added - a.total_votes_added);
  const topDistrict = sortedDistricts[0];

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* JSON-LD Schemas */}
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(generateBreadcrumbSchema(breadcrumbItems))}
      </Script>
      <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(generateFAQSchema(faqs))}
      </Script>
      <Script id="dataset-schema" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          "name": "Tamil Nadu Constituency-wise Votes Polled (2021 vs 2026)",
          "description": "Comparative dataset of absolute votes polled, vote growth percentages, and electoral changes for all 234 Assembly constituencies in Tamil Nadu between 2021 and 2026.",
          "spatialCoverage": "Tamil Nadu, India",
          "temporalCoverage": "2021/2026",
          "creator": {
            "@type": "Organization",
            "name": "KnowYourMLA"
          }
        })}
      </Script>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-500 gap-2">
            <Link href="/tn" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Analysis</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Votes Polled Trend</span>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Tamil Nadu Constituency-wise Votes Polled Comparison (2021 vs 2026)
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-4xl">
            Compare actual votes polled across all 234 Tamil Nadu Assembly constituencies to discover where raw electoral participation increased the most between the 2021 and 2026 Assembly elections.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Statewide Votes Added</p>
              <p className={`text-3xl font-bold ${data.insights.statewide_votes_added > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.insights.statewide_votes_added > 0 ? '+' : ''}{(data.insights.statewide_votes_added / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Largest Vote Addition</p>
              <p className="text-3xl font-bold text-blue-600">
                +{largestAddedVotes?.additional_votes.toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-500 mt-1">{largestAddedVotes?.name}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Highest Vote Growth</p>
              <p className="text-3xl font-bold text-indigo-600">
                +{highestVoteGrowth?.vote_growth_percentage}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {highestVoteGrowth?.name}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Constituencies</p>
              <p className="text-3xl font-bold text-gray-900">{totalConstituencies}</p>
            </div>
          </div>
        </section>

        {/* Methodology Note */}
        <div className="mb-12 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3 shadow-sm">
          <div className="mt-0.5 flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">
            <strong>Note on Methodology:</strong> The analysis and rankings on this page are calculated based on the <strong>total actual votes polled</strong> (absolute volume) rather than the <strong>votes polled percentage</strong> (turnout %). This provides a more accurate representation of raw electoral participation growth, as turnout percentages can be artificially skewed by large additions or deletions to the electoral rolls between elections.
          </p>
        </div>

        {/* Introductory SEO Content */}
        <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 mb-12 prose max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-0">Understanding Electoral Participation via Votes Polled</h2>
          <p>
            While turnout percentage is a common metric, it can be skewed by major revisions to the electoral rolls (such as the Special Intensive Revision). Analyzing <strong>constituency wise votes polled</strong> provides a much clearer picture of raw political engagement and the actual number of people walking to the booths.
          </p>
          <p>
            This page provides a comprehensive <strong>Tamil Nadu election statistics</strong> report focusing on absolute vote growth between the 2021 and 2026 Assembly elections. By examining the <strong>total votes added</strong>, we can accurately track <strong>voting participation trends across Tamil Nadu</strong>. Comparing the raw <strong>votes polled 2021 vs 2026</strong> reveals significant patterns, such as real mobilization surges in specific districts that might otherwise be hidden by electorate size changes.
          </p>
        </section>

        {/* Data Interactive Client Component */}
        <VoterTrendClient data={data} />

        {/* Automated Insights Section */}
        <section className="mt-12 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Voting Volume Trends Across Tamil Nadu</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">Largest Increase in Actual Votes</h3>
              <p className="text-gray-600 mb-4">
                The constituency of <strong>{largestAddedVotes?.name}</strong> recorded the highest absolute surge in voter participation, 
                recording <strong>{largestAddedVotes?.additional_votes.toLocaleString('en-IN')}</strong> more votes compared to 2021. 
                In terms of percentage growth in votes cast, <strong>{highestVoteGrowth?.name}</strong> led the state with a <strong>{highestVoteGrowth?.vote_growth_percentage}%</strong> increase.
              </p>
              
              <h3 className="text-lg font-bold mb-3 text-gray-800">Statewide Volume Comparison</h3>
              <p className="text-gray-600 mb-4">
                Across Tamil Nadu, the total number of valid votes polled increased by <strong>{data.insights.statewide_votes_added.toLocaleString('en-IN')}</strong>. 
                This occurred alongside a statewide electorate growth of <strong>{data.insights.total_added_electors.toLocaleString('en-IN')}</strong> registered voters between the two elections.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-3 text-gray-800">District-wise Vote Additions</h3>
              <p className="text-gray-600 mb-4">
                <strong>{topDistrict?.district_name}</strong> district saw the largest influx of new voters casting their ballots, 
                adding <strong>{topDistrict?.total_votes_added.toLocaleString('en-IN')}</strong> votes across all its constituencies. 
                On average, constituencies in this district saw their total votes grow by <strong>{topDistrict?.average_vote_growth}%</strong>.
              </p>
              
              <h3 className="text-lg font-bold mb-3 text-gray-800">Turnout Context</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>Statewide average poll percentage for 2021: <strong>{data.insights.average_turnout_2021}%</strong></li>
                <li>Statewide average poll percentage for 2026: <strong>{data.insights.average_turnout_2026}%</strong></li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
        
      </main>
    </div>
  );
}
