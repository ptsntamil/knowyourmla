import React from "react";
import PartyPageContent from "./PartyPageContent";
import { buildMetadata } from "@/lib/seo/metadata";
import { fetchParties, fetchPartyDetails } from "@/services/api";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const { fetchParties } = await import("@/services/api");
    const { slugify } = await import("@/lib/sitemap-utils");
    const parties = await fetchParties();
    return (parties || [])
      .map((p: any) => {
        const slug = p.slug || slugify(p.short_name || p.name);
        return { slug };
      })
      .filter((p: any) => p.slug);
  } catch (e) {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const data = await fetchPartyDetails(slug).catch(() => ({ party: null }));
    const partyName = data.party?.name || slug.toUpperCase();
    const shortName = data.party?.short_name || partyName;

    const ogImage = `/og/party/${slug.toLowerCase()}/all/stats`;

    const title = `${partyName} (${shortName}) Tamil Nadu: Election Trends, Districts Won, 2nd & 3rd Places | KnowYourMLA`;

    const description = `Explore ${partyName} (${shortName}) performance in Tamil Nadu: current MLAs, vote share trends, district footprints, 2nd/3rd place finishes, and deposit lost statistics.`;

    const keywords = [
      `${partyName} Party`,
      "Tamil Nadu Politics",
      "Election Analytics",
      "Vote Share Trends",
      "MLA Candidates",
      "Political Party Analysis",
      "districts won by party",
      "runner up constituencies",
      "third place constituencies",
      "historical election performance"
    ];

    return buildMetadata({
      title,
      description,
      path: `/parties/${slug}`,
      image: ogImage,
      keywords
    });
  } catch (error) {
    return buildMetadata({
      title: "Political Party Profile",
      description: "View political party MLA list and election performance analytics.",
      path: `/parties/${slug}`
    });
  }
}

export default async function PartyPage({ params }: PageProps) {
  const { slug } = await params;
  return <PartyPageContent slug={slug} election="all" />;
}
