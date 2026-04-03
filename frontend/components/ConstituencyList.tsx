import Link from "next/link";
import { ConstituencyResponse } from "@/types/models";

interface ConstituencyListProps {
  constituencies: ConstituencyResponse[];
}

export default function ConstituencyList({ constituencies }: ConstituencyListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {constituencies.map((constituency) => {
        const slug = constituency.id.replace("CONSTITUENCY#", "").toLowerCase();
        return (
          <Link key={constituency.id} href={`/tn/constituency/${slug}`} className="group">
            <div className="bg-bg-card p-6 rounded-2xl border border-border-subtle shadow-sm hover:shadow-xl hover:border-text-accent transition-all group-hover:-translate-y-1 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-black text-text-primary uppercase tracking-tight leading-tight capitalize">
                  {constituency.name.toLowerCase()}
                </h4>
                <span className={`px-3 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                  constituency.type === 'SC' ? 'bg-bg-surface text-text-primary' :
                  constituency.type === 'ST' ? 'bg-bg-accent/10 text-text-accent' :
                  'bg-bg-surface text-text-muted'
                }`}>
                  {constituency.type}
                </span>
              </div>
              <div className="flex items-center text-[10px] font-black text-text-accent uppercase tracking-[0.2em] group-hover:text-text-primary transition-colors">
                View History
                <svg className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
