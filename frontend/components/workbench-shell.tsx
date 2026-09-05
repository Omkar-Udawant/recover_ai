"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sliders,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { TelemetryRibbon } from "@/components/telemetry-ribbon";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface WorkbenchShellProps {
  children: React.ReactNode;
  activeViewTitle?: string;
}

export function WorkbenchShell({ children, activeViewTitle }: WorkbenchShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/", label: "Case Ledger", icon: Layers, count: "5,003" },
    { href: "/dashboard", label: "Analytics & Cockpit", icon: LayoutDashboard },
    { href: "/policy", label: "Guardrails & Policy", icon: ShieldCheck },
  ];

  const signOut = async () => {
    try {
      window.localStorage.removeItem("recoverai_demo_token");
    } catch {
      /* noop */
    }
    await supabase?.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300">
      {/* 220px Linear-style Fixed Left Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0 z-30",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-11 items-center justify-between px-3 border-b border-border">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-emerald-600 text-white font-mono font-bold text-xs">
              R
            </div>
            {!collapsed && (
              <div className="flex items-baseline gap-1 truncate">
                <span className="font-bold text-xs tracking-tight text-foreground">
                  Recover<span className="text-emerald-600 dark:text-emerald-400">AI</span>
                </span>
                <span className="text-[9px] font-mono text-muted-foreground">v1.2</span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-3 px-2 space-y-1">
          <div className={cn("px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
            Workspaces
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/" && (pathname === "/" || pathname === "/cases"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{item.label}</span>
                    {item.count && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}

          <div className={cn("pt-4 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
            Developer
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            )}
            title={collapsed ? "API Documentation" : undefined}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>API Explorer</span>}
          </a>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-border space-y-1 text-xs font-mono">
          <div className={cn("flex items-center justify-between px-2 py-1 text-muted-foreground text-[10px]", collapsed && "justify-center")}>
            {!collapsed && <span>Status:</span>}
            <Badge variant="settled" className="text-[9px] px-1 py-0">
              Online
            </Badge>
          </div>
        </div>
      </aside>

      {/* Main Workbench Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Persistent 44px Top Bar Dock */}
        <header className="flex h-11 items-center justify-between border-b border-border bg-card px-4 shrink-0 text-xs font-mono select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="text-muted-foreground">Workbench</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground truncate">
              {activeViewTitle || (pathname === "/" || pathname === "/cases" ? "Case Ledger" : pathname === "/dashboard" ? "Analytics & Cockpit" : "Guardrail Policy")}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px]">
              8-Agent DAG Active
            </Badge>

            <ThemeToggle />

            <Button
              onClick={signOut}
              variant="ghost"
              size="iconSm"
              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {/* 44px Flat Telemetry Ribbon */}
        <TelemetryRibbon />

        {/* Fluid Content Container */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}