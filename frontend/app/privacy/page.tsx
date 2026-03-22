import { Metadata } from "next";
import { getBaseMetadata } from "@/lib/seo";
import React from 'react';

export const metadata: Metadata = getBaseMetadata(
  "Privacy Policy",
  "Our privacy policy explains how we handle your data and protect your privacy while using our platform.",
  "privacy",
  ["Privacy Policy", "Data Protection", "KnowYourMLA Privacy", "User Data"]
);

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
        Privacy <span className="text-brand-gold">Policy</span>
      </h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">1. Data Collection</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-bold">knowyourMLA</span> does not collect any Personally Identifiable Information (PII) from its users. You can browse the platform anonymously without creating an account or providing any personal details. If you choose to contact us via feedback or email, we will only use your contact information to respond to your inquiry.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">2. Analytics and Cookies</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            We use anonymized analytics tools (such as Google Analytics or similar) to understand site traffic and usage patterns. These tools may use cookies to gather technical information, such as browser type, device type, and pages visited, which helps us improve the platform for our users. This data is aggregated and does not personally identify you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">3. External Links</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Our platform contains links to third-party websites, such as official Election Commission of India portals or MyNeta profiles. We are not responsible for the privacy practices or content of these external sites. We encourage you to read their privacy policies when you visit them.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">4. Updates to this Policy</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 italic">
          Last updated: March 2026
        </div>
      </div>
    </main>
  );
}
