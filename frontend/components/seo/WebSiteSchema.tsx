import React from "react";
import JsonLd from "./JsonLd";

export default function WebSiteSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KnowYourMLA",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app"
  };

  return <JsonLd data={data} />;
}
