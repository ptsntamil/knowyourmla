import Badge from "@/components/ui/Badge";
import { Info } from "lucide-react";

interface CabinetEventBadgeProps {
  event: string | null | undefined;
  className?: string;
}

export default function CabinetEventBadge({ event, className = "" }: CabinetEventBadgeProps) {
  if (!event) return null;

  return (
    <div className={`mt-4 pt-4 border-t border-slate-200 flex ${className}`}>
      <Badge variant="outline" size="sm" className="bg-white text-slate-500 border-slate-200 flex items-center gap-1.5 w-fit">
        <Info size={12} className="text-brand-gold" />
        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Event:</span>
        <span className="font-bold text-slate-600">{event}</span>
      </Badge>
    </div>
  );
}
