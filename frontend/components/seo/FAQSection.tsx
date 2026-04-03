import React from "react";
import JsonLd from "@/components/seo/JsonLd";
import { generateFAQSchema } from "@/lib/seo/jsonld";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
  className?: string;
}

export default function FAQSection({ faqs, title = "Frequently Asked Questions", className = "" }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className={`space-y-8 ${className}`}>
      <JsonLd data={generateFAQSchema(faqs)} />
      
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tight">
          {title}
        </h2>
        <div className="w-20 h-1.5 bg-bg-accent rounded-full" />
      </div>

      <div className="grid gap-6">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-bg-card border border-border-subtle p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-black text-text-primary mb-3">
              {faq.question}
            </h3>
            <p className="text-text-muted font-medium leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
