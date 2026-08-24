import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import ArticleHeader from '@/components/news/ArticleHeader';
import SocialShare from '@/components/news/SocialShare';
import { ChevronRight, Car, Info, Users, PieChart, ShieldAlert } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Tamil Nadu MLAs and Their Cars: An Analysis of Election Affidavits';
  const description = 'Discover how many cars Tamil Nadu MLAs own, who drives premium cars like Audi and Benz, and the details of the TN government scheme providing cars and a ₹1,000,000 monthly allowance.';
  const slug = 'tn-mlas-cars-vehicles-analysis-2026';

  return {
    title,
    description,
    keywords: ['Tamil Nadu MLAs Cars', 'TN MLA Vehicles', 'TN Govt Car Scheme', 'Udhayanidhi Stalin Car', 'V Senthilbalaji Car', 'TN MLA Allowance'],
    alternates: {
      canonical: `https://www.knowyourmla.in/news/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://www.knowyourmla.in/news/${slug}`,
      images: [
        {
          url: '/og/mla-cars-analysis.png',
          width: 1200,
          height: 630,
          alt: 'Tamil Nadu MLAs and Their Cars',
        },
      ],
    },
  };
}

export default function MlaCarsNewsPage() {
  const publishDate = "August 24, 2026";
  const readingTime = "5 min";
  const articleUrl = "/news/tn-mlas-cars-vehicles-analysis-2026";
  const title = "Tamil Nadu MLAs and Their Cars: An Analysis of Election Affidavits";

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "datePublished": "2026-08-24T00:00:00+05:30",
    "dateModified": "2026-08-24T00:00:00+05:30",
    "author": [{
      "@type": "Organization",
      "name": "KnowYourMLA",
      "url": "https://www.knowyourmla.in"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "KnowYourMLA",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.knowyourmla.in/logo.png"
      }
    },
    "description": "Discover how many cars Tamil Nadu MLAs own, who drives premium cars like Audi and Benz, and the details of the TN government scheme providing cars and allowances."
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleHeader
        title={title}
        publishDate={publishDate}
        readingTime={readingTime}
        shareUrl={`${process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app"}${articleUrl}`}
      />

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="space-y-16">

          <section className="prose prose-lg prose-slate max-w-none space-y-6">
              
              <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-6 mb-8 text-brand-dark">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-brand-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-black mt-0 mb-2">New Government Scheme Context</h3>
                    <p className="m-0 leading-relaxed text-slate-700">
                      The Tamil Nadu Government recently announced a new scheme providing dedicated vehicles to all serving MLAs. Additionally, MLAs will receive a monthly allowance of <strong>₹75,000</strong> (covering the driver's salary and vehicle maintenance) along with <strong>₹25,000</strong> for an assistant.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                In light of the state government's new initiative to provide cars and allowances to MLAs, we decided to analyze the personal vehicle holdings of all 234 elected representatives. The data below is strictly based on the assets declared by the MLAs (including their spouse and dependents) in their election affidavits.
              </p>

              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2 mt-10">
                <PieChart className="w-6 h-6 text-brand-gold" />
                The Car Count: How Many Do They Own?
              </h2>

              <p>
                Our analysis focused exclusively on <strong>four-wheelers (Cars, SUVs, Jeeps)</strong>. Out of the 234 MLAs in the Tamil Nadu assembly:
              </p>

              <ul className="grid sm:grid-cols-3 gap-4 not-prose my-8">
                <li className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <div className="text-4xl font-black text-slate-400 mb-2">66</div>
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Zero Cars</div>
                </li>
                <li className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <div className="text-4xl font-black text-brand-gold mb-2">72</div>
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Exactly 1 Car</div>
                </li>
                <li className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <div className="text-4xl font-black text-brand-dark mb-2">96</div>
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">More Than 1 Car</div>
                </li>
              </ul>

              <p>
                It is interesting to note that 66 MLAs officially declared zero cars in their affidavits. However, the majority (168 MLAs) own at least one four-wheeler, with a significant segment (96 MLAs) owning multiple cars in their household.
              </p>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mt-8 mb-8">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                  <p className="text-sm m-0 leading-relaxed text-slate-600">
                    <strong>Note:</strong> This count focuses <em>only on cars and SUVs</em>. Many MLAs own other types of vehicles such as two-wheelers, tractors, and heavy commercial vehicles. You can explore the complete, detailed breakdown of all vehicle types on our <Link href="/tn/vehicles" className="text-brand-gold font-bold hover:underline">Dedicated MLA Vehicles Dashboard</Link>.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-black text-brand-dark flex items-center gap-2 mt-10">
                <Car className="w-6 h-6 text-brand-gold" />
                The Premium Segment
              </h2>

              <p>
                A deeper dive into the specific models reveals a clear preference for premium and reliable SUVs, particularly the Toyota Innova and Fortuner, which are staples for political travel across constituencies.
              </p>

              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <Link href="/tn/mla/udhayanidhi-stalin" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">Udhayanidhi Stalin</Link> (Deputy Chief Minister) declared a Toyota Innova.
                </li>
                <li>
                  <Link href="/tn/mla/v-senthilbalaji" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">V. Senthilbalaji</Link> favors Toyota, declaring both a Fortuner and an Innova.
                </li>
                <li>
                  Premium German engineering is also present: <Link href="/tn/mla/v-k-ramkumar" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">V.K. Ramkumar</Link> declared a Mercedes-Benz GLC, while <Link href="/tn/mla/rajasekar-e" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">E. Rajasekar</Link> declared an Audi A7. <Link href="/tn/mla/jayasudha-l" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">L. Jayasudha</Link> also listed an Audi among her assets.
                </li>
                <li>
                  The Toyota Innova remains the undisputed king of political fleets, appearing heavily in the declarations of MLAs like <Link href="/tn/mla/siva-v-meyyanathan" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">Siva.V.Meyyanathan</Link>, <Link href="/tn/mla/thamimun-ansari-m" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">M. Thamimun Ansari</Link>, and <Link href="/tn/mla/panneerselvam-o" className="font-bold text-brand-dark hover:text-brand-gold transition-colors underline decoration-slate-200 underline-offset-4">O. Panneerselvam</Link>.
                </li>
              </ul>

              <h2 className="text-2xl font-black text-brand-dark mt-10">Conclusion</h2>
              <p>
                While the new government scheme ensures that every MLA has access to official transport and the resources to maintain it (₹1 Lakh total monthly allowance), the personal asset declarations show a vast disparity. Some MLAs rely entirely on public or party-provided transport (declaring 0 cars), while others maintain extensive personal fleets of premium vehicles. 
              </p>
          </section>

          <section className="bg-brand-gold/5 rounded-[40px] p-8 md:p-12 border border-brand-gold/10 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-[999]">
            <div className="space-y-4">
              <Link href="/tn/vehicles" className="block text-sm font-black text-brand-dark hover:text-brand-gold transition-colors uppercase tracking-widest py-2 border-b-2 border-brand-gold w-fit cursor-pointer relative z-[9999] pointer-events-auto">Explore The Data</Link>
              <p className="text-slate-500 text-sm leading-relaxed italic">
                Curious about what your local MLA drives? Check out our complete, <Link href="/tn/vehicles" className="font-bold text-brand-gold hover:text-brand-dark transition-colors underline underline-offset-2">interactive dashboard</Link> showing cars, bikes, tractors, and more.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end gap-4">
              <SocialShare url={`${process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app"}${articleUrl}`} title={title} />
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-8 pt-12 border-t border-slate-100 flex flex-col items-center">
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-6">Want to view the dashboard?</h3>
            <Link
              href="/tn/vehicles"
              className="group bg-brand-dark text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center gap-4 hover:bg-black transition-all shadow-xl hover:shadow-brand-gold/20"
            >
              View MLA Vehicles Dashboard
              <ChevronRight className="group-hover:translate-x-2 transition-transform text-brand-gold" />
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}
