import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.97] select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white shadow-xs hover:bg-emerald-500",
        secondary:
          "bg-secondary text-secondary-foreground border border-border shadow-xs hover:bg-secondary/80",
        outline:
          "border border-border bg-card text-foreground shadow-xs hover:bg-secondary hover:text-foreground",
        ghost: "hover:bg-secondary hover:text-foreground text-muted-foreground",
        destructive:
          "bg-rose-600 text-white shadow-xs hover:bg-rose-500",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        pastelMint: "bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25",
        pastelSky: "bg-sky-50 text-sky-800 border border-sky-200/90 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-500/25",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 px-2.5 text-[11px]",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-sm",
        icon: "h-8 w-8",
        iconSm: "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
