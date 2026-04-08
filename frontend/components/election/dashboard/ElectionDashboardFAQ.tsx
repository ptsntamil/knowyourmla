import React from 'react';
import FAQSection from '@/components/seo/FAQSection';

export default function ElectionDashboardFAQ() {
  const faq = [
    {
      question: "Who are the candidates in the Tamil Nadu Assembly Election 2026?",
      answer: "We actively track and compile candidate lists as they are announced by major political parties for the 2026 Tamil Nadu Assembly Election. You can search by candidate name, party, or constituency in our interactive directory."
    },
    {
      question: "How can I find the candidate list for my constituency?",
      answer: "Navigate to the 'Candidate Directory' section above and use the 'Constituency' filter. Alternatively, explore the 'Contest Explorer' to see a summary of all announced candidates for any of the 234 seats in Tamil Nadu."
    },
    {
      question: "Which political parties have announced candidates for 2026?",
      answer: "Major parties including DMK, AIADMK, BJP, NTK, and others are in the process of rolling out their candidate lists. Our 'Party Rollout' section provides real-time counts and metrics for each party's announcements."
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
