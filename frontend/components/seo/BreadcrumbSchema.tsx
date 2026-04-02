import React from "react";
import JsonLd from "./JsonLd";
import { generateBreadcrumbSchema } from "@/lib/seo/jsonld";

interface BreadcrumbSchemaProps {
  items: { name: string; item: string }[];
}

export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = generateBreadcrumbSchema(items);
  return <JsonLd data={schema} />;
}
