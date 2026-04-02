import React from "react";
import JsonLd from "./JsonLd";
import { generateFAQSchema } from "@/lib/seo/jsonld";

interface FAQSchemaProps {
  faqs: { question: string; answer: string }[];
}

export default function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = generateFAQSchema(faqs);
  return <JsonLd data={schema} />;
}
