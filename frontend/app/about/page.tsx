import { buildMetadata } from "@/lib/seo/metadata";
import React from 'react';

export async function generateMetadata() {
  return buildMetadata({
    title: "About Us | KnowYourMLA",
    description: "Learn about our mission to provide transparent and accessible information about Tamil Nadu MLAs and political data.",
    path: "/about",
    keywords: ["About KnowYourMLA", "Political Transparency", "Tamil Nadu Politics", "MLA Data", "Constituency Information"]
  });
}

export default function AboutUs() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-center">
      <h1 className="text-4xl font-black tracking-tight text-text-primary mb-8 border-b border-border-subtle pb-4 inline-block">
        About <span className="text-text-accent">Us</span>
      </h1>

      <div className="prose prose-invert max-w-none space-y-12 mt-12">
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
          <p className="text-text-muted leading-relaxed max-w-2xl mx-auto">
            <span className="font-bold text-text-accent">knowyourMLA</span> is dedicated to providing transparent, accessible, and comprehensive information about Members of the Legislative Assembly (MLAs) in Tamil Nadu. We believe that an informed electorate is the cornerstone of a healthy democracy.
          </p>
        </section>

        <section className="bg-bg-surface p-8 rounded-3xl border border-border-subtle">
          <h2 className="text-xl font-bold text-text-primary mb-4">Personal Interest Project</h2>
          <p className="text-text-muted leading-relaxed max-w-2xl mx-auto">
            This platform is developed and maintained as a <span className="font-bold text-text-accent">personal interest project</span>. It is driven by a passion for data transparency and a desire to make political information more accessible to the general public. Our goal is to empower citizens with the data they need to better understand their representatives and the electoral history of their constituencies.
          </p>
        </section>

        <section>
          <div className="flex flex-col items-center justify-center p-8 bg-bg-surface rounded-3xl border border-border-subtle shadow-sm">
            <div className="w-16 h-16 bg-bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Contact Us</h2>
            <p className="text-text-muted mb-4 max-w-md">
              For any inquiries, data correction requests, or collaboration proposals, please reach out to us at:
            </p>
            <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-lg font-bold text-text-accent hover:underline">
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">Feedback & Data Discrepancies</h2>
          <p className="text-text-muted leading-relaxed max-w-2xl mx-auto">
            We are committed to maintaining the highest level of data accuracy. If you notice any incorrect information or have suggestions to improve the platform, please use the <span className="font-bold">Feedback</span> button in the header or email us directly.
          </p>
        </section>

        <div className="pt-8 border-t border-border-subtle text-sm text-text-muted italic">
          Response time: Typically within 48-72 hours.
        </div>
      </div>
    </main>
  );
}
