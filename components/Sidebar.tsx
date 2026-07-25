"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, Project } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");

      const { data: memberRows } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", session.user.id)
        .limit(1);
      if (!memberRows?.length) return;

      const { data } = await supabase
        .from("projects")
        .select("id, name, workspace_id, description, created_at")
        .eq("workspace_id", memberRows[0].workspace_id)
        .order("created_at", { ascending: false });
      setProjects(data ?? []);
    }
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const PROJECT_COLORS = ["bg-violet-500", "bg-sky-500", "bg-amber-500", "bg-rose-500", "bg-teal-500", "bg-orange-500"];

  return (
    <aside className="w-[240px] flex flex-col fixed left-0 top-[52px] bottom-0 bg-[#1d2b3a] z-10 overflow-hidden">
      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#253447]">
        <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {userName.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{userName || "My Workspace"}</p>
          <p className="text-[#5b7a97] text-[11px]">Free plan</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 pt-3 space-y-0.5 overflow-y-auto">
        <NavLink href="/dashboard" active={pathname === "/dashboard"}>
          <BoardsIcon />
          Boards
        </NavLink>
        <NavLink href="/dashboard" active={false}>
          <TasksIcon />
          My tasks
        </NavLink>

        {/* Projects section */}
        {projects.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold text-[#5b7a97] uppercase tracking-wider">Projects</span>
              <Link href="/dashboard" className="text-[#5b7a97] hover:text-white text-base leading-none transition-colors">+</Link>
            </div>
            {projects.map((p, i) => (
              <NavLink key={p.id} href={`/dashboard/${p.id}`} active={pathname === `/dashboard/${p.id}`}>
                <span className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${PROJECT_COLORS[i % PROJECT_COLORS.length]}`}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-[#253447] pb-5">
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md text-sm text-[#7a9ab5] hover:text-white hover:bg-[#253447] transition-colors text-left"
        >
          <SignOutIcon />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-[#0c66e4]/20 text-white font-medium"
          : "text-[#9fb4c7] hover:bg-[#253447] hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function BoardsIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
