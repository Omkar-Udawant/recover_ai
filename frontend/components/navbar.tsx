"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { ArrowRight, Layers, LayoutDashboard, ShieldCheck } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Overview" },
    { href: "/dashboard", label: "Terminal", icon: LayoutDashboard },
    { href: "/cases", label: "Case Ledger", icon: Layers },
    { href: "/policy", label: "Guardrails", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-emerald-600 text-white font-mono font-bold text-xs">
              R
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground font-sans">
              Recover<span className="text-emerald-600 dark:text-emerald-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-[4px] transition-colors",
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>


        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1"
          >
            API Docs
          </a>


          <Link href="/dashboard">
            <Button size="sm" className="font-mono text-xs h-8">
              Launch Terminal
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
