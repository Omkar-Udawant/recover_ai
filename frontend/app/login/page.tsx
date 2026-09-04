"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(
    process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@recoverai.local"
  );
  const [password, setPassword] = useState("");

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
      if (!token) throw new Error("No token returned");
      window.localStorage.setItem("recoverai_demo_token", token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Demo sign-in failed. Is the backend running?");
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500";

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-white">
          Recover<span className="text-blue-500">AI</span>
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Sign in to your secure revenue intelligence workspace.
        </p>

        {demoMode ? (
          <form onSubmit={signInDemo} className="mt-8 space-y-3 text-left">
            <p className="text-xs text-slate-400">
              Local demo mode — sign in with the demo merchant account.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@recoverai.local"
              className={inputCls}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Demo password"
              className={inputCls}
            />
            <Button type="submit" disabled={busy} className="w-full bg-blue-600 hover:bg-blue-500">
              {busy ? "Signing in…" : "Sign in to Dashboard"}
            </Button>
          </form>
        ) : (
          <Button onClick={signInGoogle} disabled={busy} className="mt-8 w-full bg-blue-600 hover:bg-blue-500">
            {busy ? "Redirecting…" : "Continue with Google"}
          </Button>
        )}

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
      </section>
    </main>
  );
}
