import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  accent?: "mint" | "sky" | "amber" | "rose" | "violet" | "pink";
  badge?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[6px] border border-border bg-card p-4 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-border bg-secondary/40 text-muted-foreground">
          <Icon className="h-3 w-3" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          {badge && (
            <span className="rounded-[3px] bg-secondary/80 border border-border px-1.5 py-0.5 text-[9px] font-mono font-medium text-foreground">
              {badge}
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground truncate">{subtext}</span>
        </div>
      </div>
    </div>
  );
}