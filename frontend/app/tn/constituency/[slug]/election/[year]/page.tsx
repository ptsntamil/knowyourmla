import { notFound } from "next/navigation";
import { ElectionAnalyticsService } from "@/lib/services/election-analytics.service";
import { buildMetadata } from "@/lib/seo/metadata";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ConstituencyElectionHero from "@/components/election/ConstituencyElectionHero";
import ConstituencyResultMetrics from "@/components/election/ConstituencyResultMetrics";
import CandidateRankingTable from "@/components/election/CandidateRankingTable";
import ResultSummaryEditorial from "@/components/election/ResultSummaryEditorial";
import FAQSection from "@/components/seo/FAQSection";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
    year: string;
  }>;
}

const service = new ElectionAnalyticsService();

export async function generateMetadata({ params }: PageProps) {
  const { slug, year } = await params;
  const yearNum = parseInt(year);
  const constituencyId = `CONSTITUENCY#${slug}`;
  
  const result = await service.getConstituencyElectionResult(constituencyId, yearNum);
  
  if (!result) return buildMetadata({ 
    title: "Election Result Not Found",
    description: "The requested constituency election results could not be found.",
    path: `/tn/constituency/${slug}/election/${year}`
  });

  return buildMetadata({
    title: `${result.constituencyName} Election Result ${year} | Candidates & Vote Share`,
    description: result.summarySentence,
    path: `/tn/constituency/${slug}/election/${year}`,
    keywords: [
      `${result.constituencyName} Election Result ${year}`,
      `${result.constituencyName} Winner ${year}`,
      `${result.constituencyName} Candidates List`,
      "Tamil Nadu Assembly Elections"
    ]
  });
}

export default async function ConstituencyElectionResultPage({ params }: PageProps) {
  const { slug, year } = await params;
  const yearNum = parseInt(year);
  const constituencyId = `CONSTITUENCY#${slug}`;

  const result = await service.getConstituencyElectionResult(constituencyId, yearNum);

  if (!result) {
    notFound();
  }

  const districtSlug = result.districtName.toLowerCase().replace(/\s+/g, '-');
  
  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "TN", item: "/tn" },
    { name: "Elections", item: "/tn/elections" },
    { name: result.districtName, item: `/tn/districts/${districtSlug}` },
    { name: result.constituencyName, item: `/tn/constituency/${slug}` },
    { name: `${year} Result`, item: `/tn/constituency/${slug}/election/${year}` },
  ];

  const faqs = [
    {
      question: `Who won the ${result.constituencyName} election in ${year}?`,
      answer: `${result.winner.name} from ${result.winner.party} won the ${result.constituencyName} constituency in the ${year} assembly elections.`
    },
    {
      question: `What was the winning margin in ${result.constituencyName} ${year}?`,
      answer: `The winning margin was ${result.margin.toLocaleString()} votes.`
    },
    {
      question: `What was the voter turnout in ${result.constituencyName} for the ${year} election?`,
      answer: result.turnoutPercent 
        ? `The voter turnout was ${result.turnoutPercent}% in the ${year} election.`
        : `Official voter turnout data for the ${year} election in ${result.constituencyName} is listed in the results section.`
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema items={breadcrumbItems} />

      <ConstituencyElectionHero
        constituencyName={result.constituencyName}
        districtName={result.districtName}
        year={result.year}
        summarySentence={result.summarySentence}
        breadcrumbItems={breadcrumbItems}
      />

      <main className="mx-auto max-w-7xl px-4 py-16 space-y-24">
        {/* Metric Snapshot */}
        <ConstituencyResultMetrics
          winner={result.winner}
          runnerUp={result.runnerUp}
          margin={result.margin}
          turnoutPercent={result.turnoutPercent}
          totalCandidates={result.totalCandidates}
          totalVotesPolled={result.totalVotesPolled}
        />

        {/* Detailed Ranking Table */}
        <CandidateRankingTable 
          candidates={result.candidates}
          constituencyName={result.constituencyName}
        />

        {/* Editorial Summary */}
        <ResultSummaryEditorial result={result} />

        {/* FAQs */}
        <section className="pt-16 border-t border-slate-100">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
