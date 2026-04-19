import { buildMetadata } from "@/lib/seo/metadata";
import React from 'react';
import Image from 'next/image';
import { Instagram, Facebook, Linkedin, FileText, Send } from 'lucide-react';

export async function generateMetadata() {
  return buildMetadata({
    title: "About Us",
    description: "Learn about our mission to provide transparent and accessible information about Tamil Nadu MLAs and political data.",
    path: "/about",
    keywords: ["About KnowYourMLA", "Political Transparency", "Tamil Nadu Politics", "MLA Data", "Constituency Information"]
  });
}

export default function AboutUs() {
  const socials = [
    { name: 'Instagram', handle: 'ptsntamil', url: 'https://instagram.com/ptsntamil', icon: Instagram, color: 'text-pink-600' },
    { name: 'Facebook', handle: 'ptsntamil', url: 'https://facebook.com/ptsntamil', icon: Facebook, color: 'text-blue-600' },
    { name: 'Linkedin', handle: 'ptsntamil', url: 'https://linkedin.com/in/ptsntamil', icon: Linkedin, color: 'text-blue-700' },
    { name: 'Medium', handle: '@ptsntamil', url: 'https://medium.com/@ptsntamil', icon: FileText, color: 'text-slate-800 dark:text-slate-200' },
  ];

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-center">
      <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 inline-block">
        About <span className="text-brand-gold">Us</span>
      </h1>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-12 mt-12">
        <section>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Our Mission</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            <span className="font-bold text-brand-gold">knowyourMLA</span> is dedicated to providing transparent, accessible, and comprehensive information about Members of the Legislative Assembly (MLAs) in Tamil Nadu. We believe that an informed electorate is the cornerstone of a healthy democracy.
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Personal Interest Project</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            This platform is developed and maintained as a <span className="font-bold text-brand-gold">personal interest project</span>. It is driven by a passion for data transparency and a desire to make political information more accessible to the general public. Our goal is to empower citizens with the data they need to better understand their representatives and the electoral history of their constituencies.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-8">Connect with the Maker</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-gold dark:hover:border-brand-gold transition-all hover:shadow-xl hover:shadow-brand-gold/5 group active:scale-[0.98]"
              >
                <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-brand-gold/10 transition-colors ${social.color}`}>
                  <social.icon size={24} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{social.name}</p>
                  <p className="text-slate-900 dark:text-white font-bold text-lg">{social.handle}</p>
                </div>
                <Send size={16} className="ml-auto text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-100 dark:shadow-slate-900">
            <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Contact Us</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md">
              For any inquiries, data correction requests, or collaboration proposals, please reach out to us at:
            </p>
            <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-lg font-bold text-brand-gold hover:underline">
              {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Feedback & Data Discrepancies</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-4">
            We are committed to maintaining the highest level of data accuracy. If you notice any incorrect information or have suggestions to improve the platform, please use the <span className="font-bold">Feedback</span> button in the header or email us directly.
          </p>
          <p className="text-xs text-slate-500 italic">
            Response time: Typically within 48-72 hours.
          </p>
        </section>

        <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-gold/20 via-brand-gold/40 to-brand-gold/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-300"></div>
              <div className="relative px-6 py-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-brand-gold/5 group-hover:-translate-y-1">
                <Image 
                  src="/Google_Antigravity_Logo_2025.svg" 
                  alt="Google Antigravity" 
                  width={280} 
                  height={32}
                  className="object-contain dark:brightness-110"
                />
              </div>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Built with</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                Autonomous AI assistance by <span className="text-brand-gold font-black tracking-tight">Antigravity</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
