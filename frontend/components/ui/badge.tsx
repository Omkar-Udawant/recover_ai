import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[3px] border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono font-medium text-foreground transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/60 text-foreground",
        secondary: "border-border bg-secondary/40 text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        settled: "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300",
        inflight: "border-sky-500/30 bg-sky-500/5 text-sky-800 dark:text-sky-300",
        refused: "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300",
        pending: "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300",
        // Backward compatibility variants with neutral micro-tag styling
        pastelMint: "border-border bg-secondary/60 text-foreground",
        pastelSky: "border-border bg-secondary/60 text-foreground",
        pastelAmber: "border-border bg-secondary/60 text-foreground",
        pastelRose: "border-border bg-secondary/60 text-foreground",
        pastelViolet: "border-border bg-secondary/60 text-foreground",
        pastelPink: "border-border bg-secondary/60 text-foreground",
        destructive: "border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300",
      },
      pip: {
        none: "",
        emerald: "",
        sky: "",
        amber: "",
        rose: "",
        violet: "",
        slate: "",
      },
    },
    defaultVariants: {
      variant: "default",
      pip: "none",
    },
  }
);

const pipStyles = {
  none: "",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400 dark:bg-slate-500",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pipColor?: "emerald" | "sky" | "amber" | "rose" | "violet" | "slate";
  dot?: boolean;
}

function Badge({ className, variant, pipColor, dot, children, ...props }: BadgeProps) {
  // Infer pip color from variant if not explicitly provided
  const activePip = pipColor || (
    variant === "settled" || variant === "pastelMint" ? "emerald" :
    variant === "inflight" || variant === "pastelSky" ? "sky" :
    variant === "pending" || variant === "pastelAmber" ? "amber" :
    variant === "refused" || variant === "pastelRose" || variant === "destructive" ? "rose" :
    variant === "pastelViolet" ? "violet" :
    dot ? "emerald" : "none"
  );

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {activePip !== "none" && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", pipStyles[activePip])} />
      )}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };