import React from 'react';
import FAQSection from '@/components/seo/FAQSection';

export default function ElectionDashboardFAQ() {
  const faq = [
    {
      question: "Who are the candidates in the Tamil Nadu Assembly Election 2026?",
      answer: "The Tamil Nadu Assembly Election 2026 includes candidates contesting across all 234 constituencies. You can explore the full MLA candidate list by constituency, district, or party using this dashboard."
    },
    {
      question: "How can I find the candidate list for my constituency?",
      answer: "You can search for your constituency to view the list of candidates contesting in the Tamil Nadu Assembly Election 2026, along with their party affiliation and profile details."
    },
    {
      question: "Which political parties have announced candidates for 2026?",
      answer: "Major political parties such as DMK, AIADMK, BJP, and others are announcing candidates across constituencies. You can explore party-wise candidate lists on this dashboard."
    },
    {
      question: "Are sitting MLAs recontesting in the 2026 elections?",
      answer: "Yes, many sitting (incumbent) MLAs are being fielded again by their respective parties. We track incumbent retention versus 'Open Seats' periodically to show where a new representative is guaranteed."
    },
    {
      question: "What is the importance of candidate affidavit data?",
      answer: "Candidate affidavits provide legally binding information about a candidate's educational qualifications, financial assets, liabilities, and criminal records. This information is crucial for voters to make an informed decision based on the background of their potential representatives."
    }
  ];

  return (
    <div className="mt-16 border-t border-slate-100 pt-20">
      <FAQSection 
        faqs={faq} 
        title="Election FAQ: Know Your Candidates"
        className="max-w-4xl mx-auto"
      />
    </div>
  );
}
