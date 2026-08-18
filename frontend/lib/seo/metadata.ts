import { Metadata } from "next";
import { getCanonicalUrl } from "./canonical";

interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * Highly reusable Next.js Metadata builder.
 * Handles Title, Description, Canonical, OG, and Twitter tags.
 */
export function buildMetadata({ 
  title, 
  description, 
  path, 
  image, 
  keywords,
  noIndex = false 
}: MetadataOptions): Metadata {
  const canonical = getCanonicalUrl(path);
  const siteName = "KnowYourMLA";
  const fullTitle = title;
  const ogImage = image || "/logo.png";

  const result: Metadata = {
    applicationName: siteName,
    appleWebApp: { title: siteName },
    title: title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: title,
      description,
      url: canonical,
      siteName,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };

  if (image) {
    result.openGraph!.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
    result.twitter!.images = [image];
  }

  return result;
}
