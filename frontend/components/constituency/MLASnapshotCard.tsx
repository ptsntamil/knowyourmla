import Link from "next/link";
import { WinnerHistoryRecord } from "@/types/models";
import ProfileImage from "@/components/ProfileImage";
import Badge from "@/components/ui/Badge";
import PartyBadge from "@/components/ui/PartyBadge";
import {
  GraduationCap,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Target,
  Coins,
  ChevronRight,
  User
} from "lucide-react";

interface MLASnapshotCardProps {
  mla: WinnerHistoryRecord;
  constituencyName: string;
}

export default function MLASnapshotCard({ mla, constituencyName }: MLASnapshotCardProps) {
  const mlaSlug = mla.person_id
    ? mla.person_id.replace("PERSON#", "")
    : mla.winner.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const profileUrl = `/tn/mla/${mlaSlug}`;

  const formatAssets = (assets?: number) => {
    if (!assets) return "₹ 0.00 Cr";
    if (assets >= 10000000) return `₹ ${(assets / 10000000).toFixed(2)} Cr`;
    if (assets >= 100000) return `₹ ${(assets / 100000).toFixed(2)} Lac`;
    return `₹ ${assets.toLocaleString()}`;
  };

  const truncateProfession = (prof?: string) => {
    if (!prof) return "Not Available";
    return prof;
  };

  const cleanEducation = (edu?: string) => {
    if (!edu) return "Not Available";
    if (edu.includes("Category:")) {
      return edu.split(":")[1].trim().split(" ")[0].replace(/,/g, "");
    }
    return edu;
  };

  // 4) Insight Strip Zone Sentence
  const insightSentence = `${mla.winner} is the incumbent MLA of ${constituencyName}, elected in ${mla.year} from ${mla.party.short_name || mla.party.name} with a winning margin of ${mla.margin.toLocaleString()} votes.`;

  const metrics = [
    {
      label: "Education",
      value: cleanEducation(mla.education),
      icon: GraduationCap,
      color: "bg-brand-yellow/10 text-brand-yellow"
    },
    {
      label: "Profession",
      value: truncateProfession(mla.profession),
      icon: Briefcase,
      color: "bg-brand-green/10 text-brand-green"
    },
    {
      label: "Assets",
      value: formatAssets(mla.total_assets),
      icon: Coins,
      color: "bg-brand-gold/10 text-brand-gold"
    },
    {
      label: "Criminal Cases",
      value: mla.criminal_cases ?? 0,
      icon: AlertCircle,
      color: (mla.criminal_cases ?? 0) > 0 ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"
    },
    {
      label: "Winning Margin",
      value: `${mla.margin.toLocaleString()} Votes`,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-500"
    },
    {
      label: "Win Rate",
      value: `${mla.win_rate ?? 0}%`,
      icon: Target,
      color: "bg-purple-50 text-purple-500"
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Current MLA Snapshot</h2>
        <p className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Key details about the current representative
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Main Content: Identity & Metrics */}
        <div className="flex flex-col lg:flex-row">
          {/* 1) Identity Zone & 3) CTA Zone (Left/Top) */}
          <div className="lg:w-2/5 p-8 md:p-10 bg-brand-green relative overflow-hidden flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-32 h-32 md:w-36 md:h-36 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-2xl flex-shrink-0">
                  <ProfileImage
                    src={mla.profile_pic}
                    alt={mla.winner}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center md:text-left space-y-3">
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <Badge variant="gold" size="xs">Incumbent MLA</Badge>
                    {mla.total_wins === 1 && <Badge variant="slate" size="xs" className="bg-white/10 text-white border-white/5">First-time MLA</Badge>}
                    {mla.total_wins && mla.total_wins > 1 && <Badge variant="slate" size="xs" className="bg-white/10 text-white border-white/5">Re-elected</Badge>}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {mla.winner}
                  </h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 items-center">
                    <PartyBadge
                      party={mla.party.short_name || mla.party.name || ""}
                      shortName={mla.party.short_name}
                      logoUrl={mla.party.logo_url}
                      colorBg={mla.party.color_bg || '#D4AF37'}
                      colorText={mla.party.color_text || '#FFFFFF'}
                      colorBorder={mla.party.color_border || 'rgba(255,255,255,0.1)'}
                    />
                    <div className="bg-white/10 text-white px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider">
                      Elected {mla.year}
                    </div>
                    {mla.age && (
                      <div className="bg-white/10 text-white px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider">
                        {mla.age} Years Old
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <Link
                href={profileUrl}
                className="group w-full md:w-fit inline-flex items-center justify-center gap-3 bg-brand-gold text-white px-8 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-yellow transition-all shadow-xl transform active:scale-95"
              >
                View Full MLA Profile
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </Link>
            </div>
          </div>

          {/* 2) Summary Metrics Zone (Right/Bottom) */}
          <div className="lg:w-3/5 p-8 md:p-10 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full content-center">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
                >
                  <div className={`p-2 w-10 h-10 rounded-xl flex items-center justify-center ${metric.color} transition-colors group-hover:bg-opacity-20`}>
                    <metric.icon size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {metric.label}
                    </p>
                    <p 
                      className={`text-sm font-black uppercase tracking-tight ${metric.label === 'Profession' ? '' : 'truncate'} ${metric.label === 'Criminal Cases' && (mla.criminal_cases ?? 0) > 0 ? 'text-red-500' : 'text-brand-dark'}`}
                      title={String(metric.value)}
                    >
                      {metric.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4) Insight Strip Zone (Bottom) */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-green rounded-full flex-shrink-0 animate-pulse" />
          <p className="text-[11px] font-bold text-slate-500 tracking-tight leading-none">
            {insightSentence}
          </p>
        </div>
      </div>
    </section>
  );
}
