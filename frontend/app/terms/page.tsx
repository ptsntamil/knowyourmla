import { Metadata } from "next";
import { getBaseMetadata } from "@/lib/seo";
import React from 'react';

export const metadata: Metadata = getBaseMetadata(
  "Terms of Service",
  "Our terms of service outline the rules and regulations for using the KnowYourMLA platform.",
  "terms",
  ["Terms of Service", "User Agreement", "KnowYourMLA Terms", "Usage Policy"]
);

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        Terms of <span className="text-brand-gold">Service</span>
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">1. Data Source & Accuracy</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The information provided on <span className="font-bold">knowyourMLA</span> is aggregated from various public sources, including the Election Commission of India (ECI), MyNeta (ADR), and other official government repositories. While we strive for accuracy, the data is presented "as is" and should be cross-verified with official sources for any critical decision-making.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">2. No Political Endorsement</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-bold">knowyourMLA</span> is a non-partisan, neutral platform designed for data analytics and public awareness. We do not endorse any political party, candidate, or ideology. The presence of data about a candidate or party does not constitute an endorsement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">3. Permitted Usage</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            This platform is intended for personal, educational, and non-commercial use only. Users are prohibited from scraping large volumes of data or using the information for malicious purposes, including but not limited to spreading misinformation or harassment.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">4. Limitation of Liability</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Under no circumstances shall <span className="font-bold">knowyourMLA</span> or its contributors be liable for any direct, indirect, or incidental damages arising out of the use or inability to use the information provided on this platform.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 italic">
          Last updated: March 2026
        </div>
      </div>
    </main>
  );
}
