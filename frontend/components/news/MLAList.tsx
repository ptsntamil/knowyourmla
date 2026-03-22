import React from 'react';
import Link from 'next/link';
import { User, MapPin, Building2, ExternalLink } from 'lucide-react';

export const mlaDataset = [
  { name: "V. Amalu", constituency: "Gudiyatham", party: "DMK", slug: "amolo_2" },
  { name: "Aravind Ramesh", constituency: "Sholinganallur", party: "DMK", slug: "720f4b6789f7de63725c5f080c1d14da" },
  { name: "V. G. Rajendran", constituency: "Thiruvallur", party: "DMK", slug: "rasantran" },
  { name: "R. Elango", constituency: "Aravakurichi", party: "DMK", slug: "17c0329fa20ce50090871a575de209ad" },
  { name: "E. R. Eswaran", constituency: "Tiruchengodu", party: "KMDK", slug: "0f163975f1908424550df7a2fe3224a4" },
  { name: "Udayasuriyan", constituency: "Sankarapuram", party: "DMK", slug: "a2503a67aa6c2ee5510e1ef271d3b1d2" },
  { name: "J. J. Ebenezer", constituency: "R.K. Nagar", party: "DMK", slug: "374dd5abb410022f0ca45149248b199c" },
  { name: "I. Karunanithi", constituency: "Pallavaram", party: "DMK", slug: "e0a36c8573512a9b4422526bd8aef2eb" },
  { name: "S. Sudharsanam", constituency: "Madhavaram", party: "DMK", slug: "de981982bd5f95a2c8a889f5e1494993" },
  { name: "K. Sundar", constituency: "Uthiramerur", party: "DMK", slug: "4a1c607601422a1ba386fd5665aa03b5" },
  { name: "V. C. Chandrakumar", constituency: "Erode East", party: "DMK", slug: "519de3cddd96622c673c6d90559106b1" },
  { name: "Prabhakara Raja", constituency: "Virugampakkam", party: "DMK", slug: "bede48ea483f4d634f9654afcdf5ea4e" },
  { name: "J. G. Prince", constituency: "Colachal", party: "INC", slug: "c3c89434a793cb388aeca57c2992892b" },
  { name: "G. V. Markandayan", constituency: "Vilathikulam", party: "DMK", slug: "6fd8db30f5f804145bb40b81b57673b5" },
  { name: "Mohamed Shanavas", constituency: "Nagapattinam", party: "VCK", slug: "524a62e623ca7e587b3db7c1f72a096a" },
  { name: "V. Muthuraja", constituency: "Pudukkottai", party: "DMK", slug: "1d57cdca475fa6f30f05b578958d1723" },
  { name: "P. Ramalingam", constituency: "Namakkal", party: "DMK", slug: "36c8b82a42a1d1bb52fed5badd8e79d2" },
  { name: "Joseph Samuel", constituency: "Ambattur", party: "DMK", slug: "419635435cb7d5f40a20bd2084f4f5ef" },
];

const MLAList: React.FC = () => {
  return (
    <div className="my-12">
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 italic text-slate-500 text-sm mb-8">
        Below is the list of 18 MLAs who successfully recorded 100% attendance during the 2021-2026 assembly proceedings.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mlaDataset.map((mla, idx) => (
          <Link
            key={idx}
            href={`/mla/${mla.slug}`}
            className="group block p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-gold/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-400 rounded-full group-hover:bg-brand-gold group-hover:text-white transition-colors">
                    {idx + 1}
                  </span>
                  <h3 className="font-black text-slate-800 text-lg group-hover:text-brand-gold transition-colors">
                    {mla.name}
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pl-7">
                  <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin size={14} className="text-slate-300" />
                    <span>{mla.constituency}</span>
                  </div>
                  <div className="flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 size={14} className="text-slate-300" />
                    <span>{mla.party}</span>
                  </div>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-gold/10 group-hover:text-brand-gold transition-all">
                <ExternalLink size={18} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MLAList;
