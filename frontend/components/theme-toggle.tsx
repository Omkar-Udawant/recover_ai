"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("recoverai-theme");
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("recoverai-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-md border-border bg-background text-muted-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-7 w-7 rounded-md border-border bg-background hover:bg-secondary text-foreground active:scale-[96%] transition-all"
      title={theme === "light" ? "Switch to Deep Obsidian Dark" : "Switch to Swiss Porcelain Light"}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-3.5 w-3.5 text-slate-700 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      )}
    </Button>
  );
}