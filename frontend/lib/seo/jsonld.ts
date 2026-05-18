import { getCanonicalUrl } from "./canonical";

/**
 * Generates BreadcrumbList structured data.
 */
export function generateBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('http') ? item.item : getCanonicalUrl(item.item)
    }))
  };
}

/**
 * Generates FAQPage structured data.
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generates ItemList structured data.
 */
export function generateItemListSchema(items: { name: string; url: string; position?: number }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": items.length,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": item.position || index + 1,
      "name": item.name,
      "url": item.url.startsWith('http') ? item.url : getCanonicalUrl(item.url)
    }))
  };
}

/**
 * Generates Person (Politician) structured data.
 */
export function generatePersonSchema(data: { name: string; party: string; constituency: string; image?: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": ["Person", "Politician"],
    "name": data.name,
    "affiliation": {
      "@type": "Organization",
      "name": data.party
    },
    "jobTitle": `MLA from ${data.constituency} constituency`,
    "description": data.description || `${data.name} is the representative of ${data.constituency} assembly constituency in Tamil Nadu.`,
    "image": data.image,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Tamil Nadu",
      "addressCountry": "IN"
    }
  };
}
