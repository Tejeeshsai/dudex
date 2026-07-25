"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TopBar() {
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const name = session?.user?.user_metadata?.full_name || session?.user?.email || "?";
      setInitials(name.charAt(0).toUpperCase());
    });
  }, []);

  return (
    <header className="h-[52px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 fixed top-0 left-0 right-0 z-20 shadow-sm">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0 mr-2">
        <div className="w-7 h-7 rounded-[6px] bg-accent flex items-center justify-center text-white font-bold text-sm">L</div>
        <span className="font-bold text-ink text-sm tracking-tight hidden sm:block">Ledger</span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-md px-3 py-[7px] text-[13px] text-gray-400 cursor-pointer select-none">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search tasks and projects</span>
          <span className="ml-auto text-[11px] text-gray-300 hidden md:block">⌘K</span>
        </div>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white">
          {initials}
        </div>
      </div>
    </header>
  );
}

