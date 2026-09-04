"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, FileText, Layers, LayoutDashboard, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/cases", label: "Recovery Cases", icon: Layers },
  ];
  const signOut = async () => {
    try { window.localStorage.removeItem("recoverai_demo_token"); } catch { /* noop */ }
    await supabase?.auth.signOut();
    window.location.assign("/login");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold tracking-tight text-white">
                Recover<span className="text-blue-500">AI</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">v1.0</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="success" className="hidden sm:flex items-center space-x-1 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>8-Agent AI Online</span>
          </Badge>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="border-slate-800 text-xs text-slate-300">
              <FileText className="h-3.5 w-3.5 mr-1" />
              API Docs
            </Button>
          </a>

          <Link href="/cases">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs shadow-md shadow-blue-600/20">
              <Zap className="h-3.5 w-3.5 mr-1" />
              Live Cases
            </Button>
          </Link>
          <Button onClick={signOut} variant="outline" size="sm" className="border-slate-800 text-xs text-slate-300">Logout</Button>
        </div>
      </div>
    </header>
  );
}
