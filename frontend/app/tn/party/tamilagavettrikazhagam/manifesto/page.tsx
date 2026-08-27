import React from 'react';
import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { getTVKManifestoPromises } from '@/lib/data/manifesto';
import ManifestoDashboard from '@/components/tvk/ManifestoDashboard';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import ItemListSchema from '@/components/seo/ItemListSchema';
import ShareButton from '@/components/ShareButton';
import Link from 'next/link';

export const metadata: Metadata = buildMetadata({
  title: "TVK 2026 Manifesto Tracker | Live Status of Vijay's Election Promises",
  description: "Track the live implementation status of all 47 Tamilaga Vettri Kazhagam (TVK) manifesto promises. Explore budget allocations, government orders, and detailed timelines for Thalapathy Vijay's 2026 election pledges.",
  path: "tn/party/tamilagavettrikazhagam/manifesto",
  keywords: [
    "TVK Manifesto 2026", 
    "Tamilaga Vettri Kazhagam promises", 
    "Thalapathy Vijay political manifesto", 
    "TVK election tracker", 
    "Tamil Nadu 2026 elections", 
    "KnowYourMLA TVK status",
    "Annapoorani Super Six Scheme",
    "Madhippumigu Magalir Thittam"
  ],
});

export default async function TVKManifestoPage() {
  const promises = await getTVKManifestoPromises();

  const breadcrumbItems = [
    { name: "Home", item: "/" },
    { name: "TN", item: "/tn" },
    { name: "Parties", item: "/tn/parties" },
    { name: "TVK", item: "/tn/party/tamilagavettrikazhagam/2026" },
    { name: "Manifesto Tracker", item: "/tn/party/tamilagavettrikazhagam/manifesto" }
  ];

  const itemListItems = promises.map((promise, index) => ({
    name: promise.Promise_Title,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla.info'}/tn/party/tamilagavettrikazhagam/manifesto#${promise.Promise_ID}`,
    position: index + 1
  }));

  return (
    <main className="min-h-screen bg-page-bg">
      <BreadcrumbSchema items={breadcrumbItems} />
      <ItemListSchema items={itemListItems} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Visual Breadcrumbs */}
        <nav className="flex items-center flex-wrap gap-y-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6">
          <Link href="/" className="hover:text-brand-dark transition-colors">Home</Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link href="/tn" className="hover:text-brand-dark transition-colors">TN</Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link href="/tn/parties" className="hover:text-brand-dark transition-colors">Parties</Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link href="/tn/party/tamilagavettrikazhagam/2026" className="hover:text-brand-dark transition-colors">TVK</Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-brand-dark">Manifesto Tracker</span>
        </nav>

        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark">
              TVK Manifesto Tracker
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Monitoring implementation of {promises.length} key promises and administrative directives
            </p>
          </div>
          <ShareButton
            title="TVK 2026 Manifesto Tracker"
            text="Track the live implementation status of Thalapathy Vijay's TVK election promises on KnowYourMLA."
            url="/tn/party/tamilagavettrikazhagam/manifesto"
            label="Share Dashboard"
          />
        </div>
        
        <ManifestoDashboard initialData={promises} />
      </div>
    </main>
  );
}
