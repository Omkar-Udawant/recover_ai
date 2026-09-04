import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive" | "blue";
  badge?: string;
}

export function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = "default",
  badge,
}: KPICardProps) {
  const variantStyles = {
    default: "bg-slate-900/60 border-slate-800 text-slate-400",
    blue: "bg-blue-950/20 border-blue-900/40 text-blue-400",
    success: "bg-emerald-950/20 border-emerald-900/40 text-emerald-400",
    warning: "bg-amber-950/20 border-amber-900/40 text-amber-400",
    destructive: "bg-rose-950/20 border-rose-900/40 text-rose-400",
  };

  const iconBgStyles = {
    default: "bg-slate-800 text-slate-300",
    blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    destructive: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  };

  return (
    <Card className={`${variantStyles[variant]} backdrop-blur-sm shadow-md transition-all hover:border-slate-700`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBgStyles[variant]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            {value}
          </div>
          <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400">
            {badge && (
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-medium text-slate-300">
                {badge}
              </span>
            )}
            <span>{subtext}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
