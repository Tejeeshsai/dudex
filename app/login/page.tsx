"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-ink p-12">
        <span className="stamp text-xs text-accent tracking-widest">LEDGER</span>
        <div>
          <h2 className="font-display text-5xl font-semibold text-white leading-tight mb-5">
            Manage tasks.<br />Ship faster.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Collaborative kanban boards with real-time sync. Keep your team aligned and focused.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["bg-violet-400", "bg-sky-400", "bg-amber-400", "bg-rose-400"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-ink`} />
              ))}
            </div>
            <p className="text-white/30 text-xs">Teams already using Ledger</p>
          </div>
        </div>
        <p className="stamp text-[10px] text-white/20">© LEDGER 2026</p>
      </div>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-8 py-12 bg-paper">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="stamp text-xs text-accent mb-3 lg:hidden">LEDGER</p>
            <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
            <p className="text-sm text-muted mt-2">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="mb-5 rounded-card border border-warn/30 bg-red-50 px-4 py-3 text-sm text-warn flex items-start gap-2">
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus-ring w-full rounded-card border border-line bg-card px-4 py-3 text-sm outline-none transition-colors hover:border-accent/40 shadow-card"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-card border border-line bg-card px-4 py-3 text-sm outline-none transition-colors hover:border-accent/40 shadow-card"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-card bg-accent text-white py-3 text-sm font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-card mt-1"
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            No account?{" "}
            <Link href="/signup" className="text-accent font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
