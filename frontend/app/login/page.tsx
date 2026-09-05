"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(
    process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@recoverai.local"
  );
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "RecoverAI-local-demo-2026"
  );

  const demoMode = !supabase;

  async function signInGoogle() {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setError(error.message);
      toast.error(error.message);
      setBusy(false);
    }
  }

  async function signInDemo(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.post("/api/v1/auth/login", { email, password });
      const token = (res.data as { access_token?: string })?.access_token;
      if (!token) throw new Error("No token returned from server");
      window.localStorage.setItem("recoverai_demo_token", token);
      toast.success("Merchant authenticated successfully!");
      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Demo sign-in failed. Is FastAPI running?";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  const fillDemo = () => {
    setEmail("demo@recoverai.local");
    setPassword("RecoverAI-local-demo-2026");
    toast.info("Demo credentials loaded");
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 transition-colors font-mono";

  return (
    <main className="min-h-screen grid place-items-center bg-background p-6 text-foreground selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xs space-y-5 swiss-card">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Recover<span className="text-emerald-600 dark:text-emerald-400">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs">
            Sign in to your secure revenue recovery command center.
          </p>
        </div>

        {demoMode ? (
          <form onSubmit={signInDemo} className="space-y-3.5 text-left pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">Merchant Account</span>
              <button
                type="button"
                onClick={fillDemo}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <KeyRound className="h-2.5 w-2.5 inline mr-1" />
                Auto-fill demo
              </button>
            </div>

            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@recoverai.local"
                className={inputCls}
              />
            </div>

            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Demo password"
                className={inputCls}
              />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 shadow-xs"
            >
              {busy ? "Authenticating..." : "Sign in to Recovery Terminal"}
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </form>
        ) : (
          <Button
            onClick={signInGoogle}
            disabled={busy}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 shadow-xs"
          >
            {busy ? "Connecting to Supabase..." : "Continue with Google SSO"}
          </Button>
        )}

        {error && (
          <p className="text-xs text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 border border-rose-200/90 dark:border-rose-500/30 p-2 rounded-lg font-mono">
            {error}
          </p>
        )}

        <div className="pt-2 border-t border-border text-[11px] text-muted-foreground font-mono">
          Zero external API dependencies required in demo mode
        </div>
      </section>
    </main>
  );
}
