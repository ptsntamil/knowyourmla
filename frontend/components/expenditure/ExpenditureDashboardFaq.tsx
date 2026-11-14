"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  id: string;
}

interface ExpenditureDashboardFaqProps {
  parties: string[];
}

export function ExpenditureDashboardFaq({ parties }: ExpenditureDashboardFaqProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const partyListString = parties.length > 1
    ? `${parties.slice(0, -1).join(", ")} and ${parties[parties.length - 1]}`
    : parties.join(", ");

  const faqs: FaqItem[] = [
    {
      id: "q1",
      question: "What is Tamil Nadu Election Expenditure Transparency?",
      answer: "This section presents reported election expenditure for political parties participating in the 2026 Tamil Nadu Assembly election. It organizes available disclosures into categories such as media advertising, campaign materials, travel, rallies, candidate-related expenditure and other reported expenses."
    },
    {
      id: "q2",
      question: "How much did political parties spend in the 2026 Tamil Nadu election?",
      answer: "The dashboard presents expenditure reported in the available party disclosures. The figures should not automatically be interpreted as a single Tamil Nadu-wide total because individual reports can have different reporting scopes."
    },
    {
      id: "q3",
      question: "Which parties are included in the expenditure data?",
      answer: `The current dataset includes available expenditure information for ${partyListString}. The availability and level of detail vary by source.`
    },
    {
      id: "q4",
      question: "What does \"reported expenditure\" mean?",
      answer: "Reported expenditure means an amount explicitly stated in the source document or published source. It is kept separate from amounts calculated by KnowYourMLA from individual expenditure categories."
    },
    {
      id: "q5",
      question: "Are the expenditure figures directly comparable between parties?",
      answer: "Not always. Different reports may cover different geographic or organizational scopes. For example, a filing may cover Tamil Nadu alone, Tamil Nadu and Puducherry, or multiple states. KnowYourMLA therefore displays the reporting scope alongside the expenditure figures."
    },
    {
      id: "q6",
      question: "What is included under general propaganda expenditure?",
      answer: "General propaganda can include reported expenditure such as media advertising, campaign materials, campaign travel, public meetings and rallies, and other party-wide propaganda expenditure. The exact categories available depend on the source disclosure."
    },
    {
      id: "q7",
      question: "What is candidate expenditure?",
      answer: "Candidate expenditure refers to expenditure reported under candidate-related categories in the available disclosure. Depending on the source, this may include candidate payments, candidate-specific media, campaign materials, rallies, other candidate expenditure and criminal antecedent publication."
    },
    {
      id: "q8",
      question: "What is the difference between party expenditure and candidate expenditure?",
      answer: "Party expenditure generally relates to broader party campaign or propaganda activities, while candidate expenditure relates to candidate-related spending reported in the source. The dashboard keeps these categories separate where the source provides the distinction."
    },
    {
      id: "q9",
      question: "Why are some expenditure categories shown as ₹0?",
      answer: "A value of ₹0 means the source explicitly reported zero expenditure for that category. It is different from a category for which no information was provided."
    },
    {
      id: "q10",
      question: "Why are some values shown as \"Not disclosed\" or \"—\"?",
      answer: "This means the available source does not provide a value for that category. A missing value should not be interpreted as zero expenditure."
    },
    {
      id: "q11",
      question: "Where does the expenditure data come from?",
      answer: "KnowYourMLA uses available election expenditure filings and published source material. Each party page identifies the applicable source type and reporting scope, with access to the source document where available."
    },
    {
      id: "q12",
      question: "Why might the total not equal the sum of all categories?",
      answer: "The source-reported total and the sum of detailed categories can occasionally differ. KnowYourMLA preserves the reported total and separately calculates category totals rather than silently changing one to match the other. Relevant discrepancies are explained on the applicable party page."
    },
    {
      id: "q13",
      question: "Does KnowYourMLA calculate any of the figures?",
      answer: "Yes. Some values shown on the website, such as category percentages and spending shares, are calculated from the underlying reported figures. The original source-reported amounts are preserved separately."
    },
    {
      id: "q14",
      question: "Does the expenditure data represent all election spending?",
      answer: "Not necessarily. The dashboard represents expenditure available in the identified disclosures and sources. It should not be interpreted as a complete independent audit of every election-related expense."
    },
    {
      id: "q15",
      question: "Can I see the original expenditure documents?",
      answer: "Where the source document is available, the relevant party page provides access to the source information or document."
    },
    {
      id: "q16",
      question: "How does KnowYourMLA handle discrepancies in the source data?",
      answer: "KnowYourMLA does not silently correct or reconcile source figures. Reported values, calculated values and differences are retained separately, and relevant discrepancies are explained in the applicable source notes."
    }
  ];

  return (
    <section className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8 md:p-12 mb-16">
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
                "text": faq.answer
              }
            }))
          })
        }}
      />
      
      <div className="max-w-3xl mb-8">
        <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight mb-4">Frequently Asked Questions</h2>
        <p className="text-slate-600 text-lg">
          Learn how the election expenditure data is collected, organized and presented on KnowYourMLA.
        </p>
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
