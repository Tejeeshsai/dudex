"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, Project, Workspace } from "@/lib/supabase";

type TaskCounts = { total: number; done: number; todo: number; in_progress: number };

const CARD_COLORS = [
  { gradient: "from-violet-500 to-purple-700",  text: "#7c3aed" },
  { gradient: "from-sky-500 to-blue-700",        text: "#2563eb" },
  { gradient: "from-amber-500 to-orange-600",    text: "#d97706" },
  { gradient: "from-rose-500 to-pink-700",       text: "#e11d48" },
  { gradient: "from-teal-500 to-emerald-700",    text: "#0d9488" },
  { gradient: "from-orange-500 to-red-600",      text: "#ea580c" },
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCard({ label, value, sub, gradient, icon }: {
  label: string; value: number; sub: string; gradient: string; icon: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute -top-2 -right-2 text-5xl opacity-10 font-black select-none">{icon}</div>
      <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-4xl font-black mt-1 leading-none">{value}</p>
      <p className="text-white/60 text-[10px] mt-1.5">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [taskCounts, setTaskCounts] = useState<Record<string, TaskCounts>>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "there";
      setUserName(name);

      const { data: memberRows } = await supabase
        .from("workspace_members")
        .select("workspace_id, workspaces(*)")
        .eq("user_id", session.user.id)
        .limit(1);

      const ws = (memberRows?.[0] as any)?.workspaces as Workspace | undefined;
      if (!ws) { setLoading(false); return; }
      setWorkspace(ws);

      const { data: projectRows } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", ws.id)
        .order("created_at", { ascending: false });

      setProjects(projectRows ?? []);

      if (projectRows && projectRows.length > 0) {
        const { data: allTasks } = await supabase
          .from("tasks")
          .select("project_id, status")
          .in("project_id", projectRows.map((p) => p.id));

        const counts: Record<string, TaskCounts> = {};
        for (const t of allTasks ?? []) {
          counts[t.project_id] ??= { total: 0, done: 0, todo: 0, in_progress: 0 };
          counts[t.project_id].total += 1;
          if (t.status === "done") counts[t.project_id].done += 1;
          else if (t.status === "todo") counts[t.project_id].todo += 1;
          else if (t.status === "in_progress") counts[t.project_id].in_progress += 1;
        }
        setTaskCounts(counts);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !newName.trim()) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ workspace_id: workspace.id, name: newName.trim(), description: newDesc.trim() || null })
      .select()
      .single();
    if (!error && data) {
      setProjects((prev) => [data, ...prev]);
      setNewName(""); setNewDesc(""); setShowNew(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted">Loading workspace…</p>
        </div>
      </div>
    );
  }

  const totalTasks      = Object.values(taskCounts).reduce((s, c) => s + c.total,       0);
  const totalDone       = Object.values(taskCounts).reduce((s, c) => s + c.done,        0);
  const totalInProgress = Object.values(taskCounts).reduce((s, c) => s + c.in_progress, 0);
  const completionPct   = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  return (
    <>
      {/* ── Vivid gradient hero ── */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 px-8 py-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-56 h-56 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-4 left-1/2 w-40 h-40 bg-pink-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between mb-8">
          <div>
            <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-1">
              {workspace?.name ?? "Workspace"}
            </p>
            <h1 className="text-3xl font-black text-white">
              Good {getTimeOfDay()}, {userName} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {projects.length} board{projects.length !== 1 ? "s" : ""} · {totalTasks} task{totalTasks !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="flex items-center gap-2 bg-white text-indigo-900 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-lg"
          >
            <span className="text-base leading-none">{showNew ? "✕" : "+"}</span>
            {showNew ? "Cancel" : "New board"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Boards"      value={projects.length} sub="active workspaces"  gradient="from-violet-500 to-purple-700"  icon="▦" />
          <StatCard label="All Tasks"   value={totalTasks}      sub="across all boards"   gradient="from-sky-500 to-blue-600"       icon="✦" />
          <StatCard label="In Progress" value={totalInProgress} sub="being worked on"     gradient="from-amber-500 to-orange-600"   icon="⚡" />
          <StatCard label="Completed"   value={totalDone}       sub={`${completionPct}% done`} gradient="from-emerald-500 to-teal-600" icon="✓" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-8">
        {showNew && (
          <form onSubmit={createProject} className="mb-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-black">+</span>
              New board
            </h3>
            <input
              autoFocus required value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name, e.g. Marketing Sprint"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <input
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <button type="submit"
              className="rounded-xl bg-violet-600 text-white text-sm font-bold px-5 py-2 hover:bg-violet-700 transition-colors">
              Create board
            </button>
          </form>
        )}

        {projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-violet-200 py-24 text-center bg-violet-50/30">
            <p className="text-5xl mb-4">🚀</p>
            <p className="text-base font-bold text-gray-800 mb-1">No boards yet</p>
            <p className="text-sm text-muted">Click "New board" above to create your first project.</p>
          </div>
        ) : (
          <>
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Your boards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((p, i) => {
                const c = taskCounts[p.id] ?? { total: 0, done: 0, todo: 0, in_progress: 0 };
                const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
                const color = CARD_COLORS[i % CARD_COLORS.length];
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/${p.id}`}
                    className="group rounded-2xl border border-gray-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                  >
                    {/* Color strip */}
                    <div className={`h-24 bg-gradient-to-br ${color.gradient} relative p-4 flex items-end overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                      <div className="relative">
                        <h2 className="font-bold text-white text-lg leading-tight">{p.name}</h2>
                        {p.description && (
                          <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{p.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted mb-1.5">
                          <span>{pct}% complete</span>
                          <span className="font-semibold text-gray-600">{c.done}/{c.total}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${color.gradient} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {c.todo > 0        && <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{c.todo} todo</span>}
                        {c.in_progress > 0 && <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">{c.in_progress} in progress</span>}
                        {c.done > 0        && <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{c.done} done</span>}
                        {c.total === 0     && <span className="text-[10px] text-muted italic">No tasks yet</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

