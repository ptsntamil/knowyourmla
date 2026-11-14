"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  answerText: string; // Plain text for JSON-LD
  id: string;
}

interface ExpenditurePartyFaqProps {
  report: any; // Using any for simplicity in this context, matching the existing app model
}

export function ExpenditurePartyFaq({ report }: ExpenditurePartyFaqProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const formatCr = (val?: number) => val != null ? `₹${(val / 10000000).toFixed(2)} crore` : null;
  const formatRsExact = (val?: number) => val != null ? `₹${val.toLocaleString("en-IN")}` : null;

  const faqs: FaqItem[] = [];
  let idCounter = 1;
  const addFaq = (question: string, answer: React.ReactNode, answerText: string) => {
    faqs.push({ id: `pq${idCounter++}`, question, answer, answerText });
  };

  const partyName = report.party_short;
  const reportedTotalCr = formatCr(report.reported_total_rs);

  // Q1: Total
  if (reportedTotalCr) {
    const text = `${partyName} reported total election expenditure of ${reportedTotalCr} in the available disclosure covering ${report.report_scope}.`;
    addFaq(`How much election expenditure did ${partyName} report in 2026?`, text, text);
  }

  // Q2: General Propaganda
  const genPropCr = formatCr(report.general_propaganda_rs);
  if (genPropCr && report.general_propaganda_rs > 0) {
    const text = `${partyName} reported ${genPropCr} as general propaganda expenditure in the available disclosure.`;
    addFaq(`How much did ${partyName} report as general propaganda expenditure?`, text, text);
  }

  // Q3: Candidate Expenditure
  const candExpCr = formatCr(report.candidate_expenditure_rs);
  if (report.candidate_expenditure_rs === 0) {
    const text = `${partyName} reported ₹0 as candidate expenditure.`;
    addFaq(`How much did ${partyName} report as candidate expenditure?`, text, text);
  } else if (candExpCr) {
    const text = `${partyName} reported ${candExpCr} as candidate expenditure.`;
    addFaq(`How much did ${partyName} report as candidate expenditure?`, text, text);
  } else {
    const text = `The available source does not separately disclose a candidate expenditure amount.`;
    addFaq(`How much did ${partyName} report as candidate expenditure?`, text, text);
  }

  // Q4: Major Categories
  const categories = report.categories || [];
  const sortedCategories = [...categories].sort((a: any, b: any) => (b.amount_rs || 0) - (a.amount_rs || 0));
  const majorCategories = sortedCategories.filter((c: any) => c.amount_rs && c.amount_rs > 0);
  
  if (majorCategories.length > 0) {
    const names = majorCategories.map((c: any) => c.display_category_name.toLowerCase());
    const formattedList = names.length > 1 
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : names[0];
    
    const text = `The available disclosure includes ${formattedList}.`;
    
    // For rich UI, we can use a ul/li, but since the prompt says "The available disclosure includes...", we'll just output the paragraph.
    addFaq(`What were the major expenditure categories reported by ${partyName}?`, text, text);
  }

  // Q5: Media Advertising
  const mediaCat = categories.find((c: any) => c.category_name.toLowerCase().includes("media"));
  if (mediaCat && mediaCat.amount_rs != null) {
    const mediaCr = formatCr(mediaCat.amount_rs);
    const text = `${partyName} reported ${mediaCr} under media advertising in the available expenditure disclosure.`;
    addFaq(`How much did ${partyName} report on media advertising?`, text, text);
  }

  // Q6: Candidate Payments
  const candPayCat = categories.find((c: any) => c.category_name.toLowerCase().includes("lump-sum") || c.category_name.toLowerCase().includes("funding"));
  if (candPayCat && candPayCat.amount_rs != null) {
    const candPayCr = formatCr(candPayCat.amount_rs);
    const text = `${partyName} reported ${candPayCr} as candidate payments.`;
    addFaq(`How much did ${partyName} report as candidate payments?`, text, text);
  }

  // Q7: Reporting Scope
  if (report.report_scope) {
    const text = `The available ${partyName} expenditure disclosure covers ${report.report_scope}. Reporting scope is displayed because figures from reports covering different geographic areas should not automatically be treated as directly comparable.`;
    addFaq(`What is the reporting scope of the ${partyName} expenditure report?`, text, text);
  }

  // Q8: Calculated?
  if (reportedTotalCr) {
    const text = `No. The ${reportedTotalCr} figure represents the reported total in the source. KnowYourMLA separately calculates category totals and derived percentages where applicable.`;
    addFaq(`Is the ${reportedTotalCr} figure calculated by KnowYourMLA?`, text, text);
  }

  // Q9: Discrepancy
  if (report.reconciliation_difference_rs && report.reconciliation_difference_rs !== 0) {
    const reportedExact = formatRsExact(report.reported_total_rs);
    const calcExact = formatRsExact(report.calculated_category_total_rs);
    const diffExact = formatRsExact(report.reconciliation_difference_rs);
    const text = `The source reports a total of ${reportedExact}, while the available detailed categories sum to ${calcExact}, resulting in a difference of ${diffExact}.`;
    addFaq(`Why might the reported total differ from the sum of the detailed categories?`, text, text);
  }

  // Q10: Source
  if (report.source_type) {
    const text = `The ${partyName} expenditure information is based on ${report.source_type}. The page provides source information and, where available, access to the original document.`;
    addFaq(`What is the source of the ${partyName} expenditure data?`, text, text);
  }

  // Q11: All spending?
  const text11 = `The figure represents expenditure reported in the available disclosure and should not automatically be interpreted as an independent audit of every election-related expense.`;
  addFaq(`Does ${partyName}'s reported expenditure represent all of its election spending?`, text11, text11);

  // Q12: Percentages
  const text12 = `Percentages shown on this page are calculated from the underlying reported figures. For example: Category percentage = Category expenditure ÷ relevant expenditure group × 100. These are KnowYourMLA-derived values and are not necessarily percentages explicitly stated in the source document.`;
  
  const richText12 = (
    <div className="space-y-2">
      <p>Percentages shown on this page are calculated from the underlying reported figures. For example:</p>
      <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100 my-2 text-center font-mono text-slate-700">
        Category percentage = Category expenditure ÷ relevant expenditure group × 100
      </div>
      <p>These are KnowYourMLA-derived values and are not necessarily percentages explicitly stated in the source document.</p>
    </div>
  );
  addFaq(`How are the percentages on this page calculated?`, richText12, text12);

  return (
    <section className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8 md:p-12">
      {/* JSON-LD Schema Generation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answerText
              }
            }))
          })
        }}
      />
      
      <div className="max-w-3xl mb-8">
        <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight mb-4">Frequently Asked Questions</h2>
      </div>

      <div className="divide-y divide-slate-100">
        {faqs.map(faq => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="py-2">
              <h3>
                <button
                  type="button"
                  id={`faq-btn-${faq.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${faq.id}`}
                  className="flex w-full items-center justify-between py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 rounded-lg group"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  <span className="font-bold text-slate-800 text-lg group-hover:text-brand-dark transition-colors">{faq.question}</span>
                  <ChevronDown className={`flex-shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
                </button>
              </h3>
              <div
                id={`faq-panel-${faq.id}`}
                role="region"
                aria-labelledby={`faq-btn-${faq.id}`}
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="pb-6 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
