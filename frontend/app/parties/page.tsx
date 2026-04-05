import { fetchParties } from "@/services/api";
import PartyFilters from "@/components/PartyFilters";
import SEOHeader from "@/components/SEOHeader";
import { buildMetadata } from "@/lib/seo/metadata";
import { commonBreadcrumbs } from "@/lib/seo/breadcrumbs";
import { generateItemListSchema } from "@/lib/seo/jsonld";
import SEOIntro from "@/components/seo/SEOIntro";
import FAQSection from "@/components/seo/FAQSection";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ItemListSchema from "@/components/seo/ItemListSchema";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildMetadata({
    title: "Political Parties in Tamil Nadu | Election History & Analysis",
    description: "Explore party-wise election history, candidates, performance, and analytics across Tamil Nadu Assembly elections on KnowYourMLA.",
    path: "/parties",
    keywords: ["Tamil Nadu Politics", "Political Parties", "DMK", "ADMK", "BJP", "Congress", "Election Analytics"]
  });
}

export default async function PartiesPage() {
  const parties = await fetchParties();

  const faqs = [
    {
      question: "How many political parties are active in Tamil Nadu?",
      answer: "Tamil Nadu has a vibrant multi-party system with several major parties like DMK, AIADMK, and others representing the electorate in the state assembly."
    },
    {
      question: "Where can I view the current party-wise MLA list?",
      answer: "You can click on any party card on this page to view their current MLA list, historical performance, and detailed candidate analytics."
    },
    {
      question: "Which party has the most MLAs in Tamil Nadu?",
      answer: "You can check the current assembly composition and party-wise strengths by exploring the individual party profiles and the state-wide MLA list on KnowYourMLA."
    }
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <BreadcrumbSchema
        items={[
          commonBreadcrumbs.home,
          { name: "Parties", item: "/parties" }
        ]}
      />
      <ItemListSchema
        items={parties.slice(0, 10).map((party: any, index: number) => ({
          name: party.name,
          url: `/parties/${party.slug || party.short_name.toLowerCase()}`,
          position: index + 1
        }))}
      />

      <SEOHeader
        title="Political Parties in Tamil Nadu"
        subtitle="Explore party-wise election history, candidates, performance, and analytics across Tamil Nadu Assembly elections."
      />

      <main className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        {/* <SEOIntro 
          h1="Political Parties in Tamil Nadu"
          intro="Explore the complete list of political parties in Tamil Nadu, including their historical performance, current MLAs, and candidate details across various assembly elections."
        /> */}

        <PartyFilters initialParties={parties} />

        <section className="mt-32 pt-16 border-t border-slate-100 dark:border-slate-800">
          <FAQSection faqs={faqs} />
        </section>
      </main>
    </div>
  );
}
