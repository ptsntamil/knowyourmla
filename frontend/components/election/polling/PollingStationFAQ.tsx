import React from 'react';
import FAQSection from '@/components/seo/FAQSection';

interface PollingStationFAQProps {
  constituencyName: string;
  year: number;
}

export default function PollingStationFAQ({ constituencyName, year }: PollingStationFAQProps) {
  const faq = [
    {
      question: `What is the significance of polling station wise results for ${constituencyName}?`,
      answer: `Polling station wise results for ${constituencyName} provide granular, booth-level data on voter behavior. This allows analysts to identify specific geographic pockets of support and understand how different demographics within the constituency voted in the ${year} election.`
    },
    {
      question: "How can I identify candidate strongholds in this constituency?",
      answer: "Strongholds are identified as polling stations where a candidate significantly outperformed their average vote share. Our 'Booth Dominance' analytics section highlights these 'Fortress' booths where a single candidate has commanded over 50% or 60% of the total votes."
    },
    {
      question: "What does high turnout in a specific polling station indicate?",
      answer: "High voter turnout often indicates strong political mobilization or highly competitive local dynamics. In our table, you can sort polling stations by 'Turnout %' to see which booths had the most active participation in the election."
    },
    {
      question: "How is booth-level vote share calculated?",
      answer: "The vote share for each candidate at a polling station is calculated by dividing the total votes they received by the total valid votes polled in that specific booth, expressed as a percentage."
    },
    {
      question: "Why is analyzing winning margins at the booth level important?",
      answer: "Analyzing margins at the booth level helps in understanding the intensity of the contest. It shows where the competition was neck-and-neck (Swing Booths) versus where one candidate won by a large, comfortable margin, providing insights into voter consolidation."
    }
  ];

  return (
    <div className="mt-20 border-t border-[#F4B63D]/10 pt-20">
      <FAQSection 
        faqs={faq} 
        title={`${constituencyName} Booth-Level Results: FAQ`}
        className="max-w-7xl mx-auto"
      />
    </div>
  );
}
