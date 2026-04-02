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
        <h2 className="text-2xl md:text-3xl font-black text-brand-dark dark:text-slate-100 uppercase tracking-tight">
          {title}
        </h2>
        <div className="w-20 h-1.5 bg-brand-gold rounded-full" />
      </div>

      <div className="grid gap-6">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-black text-brand-dark dark:text-slate-200 mb-3">
              {faq.question}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
