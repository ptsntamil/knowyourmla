import React from "react";
import PartyPageContent from "../PartyPageContent";
import { buildMetadata } from "@/lib/seo/metadata";
import { fetchParties, fetchPartyDetails } from "@/services/api";
import { AVAILABLE_ELECTION_YEARS } from "@/lib/constants/elections";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string; year: string }>;
}

export async function generateStaticParams() {
  try {
    const { fetchParties } = await import("@/services/api");
    const { slugify } = await import("@/lib/sitemap-utils");
    const parties = await fetchParties();
    const params: { slug: string; year: string }[] = [];
    
    (parties || []).forEach((p: any) => {
      const slug = p.slug || slugify(p.short_name || p.name);
      if (slug) {
        AVAILABLE_ELECTION_YEARS.forEach(year => {
          params.push({ slug, year: year.toString() });
        });
      }
    });
    
    return params;
  } catch (e) {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, year } = await params;
  try {
    const data = await fetchPartyDetails(slug).catch(() => ({ party: null }));
    const partyName = data.party?.name || slug.toUpperCase();
    const shortName = data.party?.short_name || partyName;

    const ogImage = `/og/party/${slug.toLowerCase()}/${year}/stats`;

    const title = `${shortName} Election Performance ${year}: District Footprint, 2nd & 3rd Places | KnowYourMLA`;

    const description = `Get detailed election performance of ${partyName} (${shortName}) in Tamil Nadu ${year}. Check contested seats, district footprints, 2nd and 3rd place finishes, and deposit lost stats.`;

    const keywords = [
      `${partyName} Party`,
      "Tamil Nadu Politics",
      "Election Analytics",
      "Vote Share Trends",
      "MLA Candidates",
      "Political Party Analysis",
      "district footprint",
      "second place finishes",
      "third place finishes",
      "deposit lost candidates",
      "party deposit lost seats",
      "candidates who lost deposit in election",
      "deposit lost analysis Tamil Nadu election",
      "which party lost most deposits"
    ];

    return buildMetadata({
      title,
      description,
      path: `/parties/${slug}/${year}`,
      image: ogImage,
      keywords
    });
  } catch (error) {
    return buildMetadata({
      title: "Political Party Profile",
      description: "View political party MLA list and election performance analytics.",
      path: `/parties/${slug}/${year}`
    });
  }
}

export default async function PartyYearPage({ params }: PageProps) {
  const { slug, year } = await params;
  return <PartyPageContent slug={slug} election={year} />;
}
