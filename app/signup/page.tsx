"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-accentSoft flex items-center justify-center mx-auto mb-5">
            <span className="text-accent text-2xl">✓</span>
          </div>
          <h1 className="font-display text-2xl font-semibold mb-3">Check your inbox</h1>
          <p className="text-sm text-muted">
            We sent a confirmation link to <strong className="text-ink">{email}</strong>. Confirm it, then sign in.
          </p>
          <Link href="/login" className="inline-block mt-6 bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-card hover:bg-emerald-700 transition-colors shadow-card">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-ink p-12">
        <span className="stamp text-xs text-accent tracking-widest">LEDGER</span>
        <div>
          <h2 className="font-display text-5xl font-semibold text-white leading-tight mb-5">
            One signup.<br />Infinite boards.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Your personal workspace is created automatically. Start organizing in seconds.
          </p>
          <ul className="mt-10 space-y-3">
            {["Kanban boards with drag & drop", "Real-time collaboration", "Task comments & activity log"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-white/50 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="stamp text-[10px] text-white/20">© LEDGER 2026</p>
      </div>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-8 py-12 bg-paper">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="stamp text-xs text-accent mb-3 lg:hidden">LEDGER</p>
            <h1 className="font-display text-3xl font-semibold text-ink">Create account</h1>
            <p className="text-sm text-muted mt-2">Your workspace is ready instantly</p>
          </div>

          {error && (
            <div className="mb-5 rounded-card border border-warn/30 bg-red-50 px-4 py-3 text-sm text-warn flex items-start gap-2">
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1.5 uppercase tracking-wider">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="focus-ring w-full rounded-card border border-line bg-card px-4 py-3 text-sm outline-none transition-colors hover:border-accent/40 shadow-card"
                placeholder="Jane Doe"
              />
            </div>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring w-full rounded-card border border-line bg-card px-4 py-3 text-sm outline-none transition-colors hover:border-accent/40 shadow-card"
                placeholder="At least 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring w-full rounded-card bg-accent text-white py-3 text-sm font-semibold hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-card mt-1"
            >
              {loading ? "Creating…" : "Create account →"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
