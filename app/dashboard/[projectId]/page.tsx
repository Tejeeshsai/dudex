"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { supabase, Task, TaskStatus, TaskPriority, Project } from "@/lib/supabase";
import KanbanColumn from "@/components/KanbanColumn";
import TaskModal from "@/components/TaskModal";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

const PROJECT_GRADIENTS = [
  "from-violet-600 via-purple-700 to-indigo-800",
  "from-sky-500 via-blue-600 to-indigo-800",
  "from-amber-500 via-orange-600 to-red-700",
  "from-rose-500 via-pink-600 to-purple-800",
  "from-teal-500 via-emerald-600 to-cyan-800",
  "from-orange-500 via-amber-600 to-yellow-700",
];

function getProjectGradient(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PROJECT_GRADIENTS[hash % PROJECT_GRADIENTS.length];
}

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("med");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const { data: projectRow } = await supabase
      .from("projects").select("*").eq("id", projectId).single();
    setProject(projectRow);

    const { data: taskRows } = await supabase
      .from("tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
    setTasks(taskRows ?? []);
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTasks((prev) => [...prev, payload.new as Task]);
        } else if (payload.eventType === "UPDATE") {
          setTasks((prev) => prev.map((t) => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)));
        } else if (payload.eventType === "DELETE") {
          setTasks((prev) => prev.filter((t) => t.id !== (payload.old as Task).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, loadData]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    if (!STATUSES.includes(newStatus)) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);

    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("task_activity").insert({ task_id: taskId, actor_id: session?.user.id, action: `moved to ${newStatus.replace("_", " ")}` });
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({ project_id: projectId, title: newTitle.trim(), status: "todo", priority: newPriority, created_by: session.user.id })
      .select()
      .single();

    if (!error && data) {
      setNewTitle("");
      setNewPriority("med");
      setShowNewTask(false);
      setTasks((prev) => (prev.some((t) => t.id === data.id) ? prev : [...prev, data]));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted">Loading board</p>
        </div>
      </div>
    );
  }

  const gradient = getProjectGradient(projectId);
  const todoCnt   = tasks.filter((t) => t.status === "todo").length;
  const inProgCnt = tasks.filter((t) => t.status === "in_progress").length;
  const doneCnt   = tasks.filter((t) => t.status === "done").length;

  return (
    <>
      <div className={`relative bg-gradient-to-br ${gradient} px-8 py-7 overflow-hidden`}>
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <a href="/dashboard" className="hover:text-white transition-colors font-medium">Boards</a>
            <span>{'>'}</span>
            <span className="text-white font-semibold">{project?.name}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-white">{project?.name}</h1>
              {project?.description && (
                <p className="text-white/70 text-sm mt-1">{project.description}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">{todoCnt} todo</span>
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">{inProgCnt} in progress</span>
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-semibold">{doneCnt} done</span>
              </div>
            </div>
            <button
              onClick={() => setShowNewTask((v) => !v)}
              className="flex items-center gap-2 bg-white text-slate-900 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
            >
              <span className="text-base leading-none">{showNewTask ? "X" : "+"}</span>
              {showNewTask ? "Cancel" : "New task"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#f0f2f5] min-h-[calc(100vh-220px)]">
        {showNewTask && (
          <form onSubmit={createTask} className="mb-5">
            <div className="flex gap-2 bg-white rounded-2xl border border-gray-200 shadow-md p-3 items-center">
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 text-sm outline-none px-2 text-gray-800 placeholder-gray-400"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="text-xs rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 text-gray-600 outline-none"
              >
                <option value="low">Low</option>
                <option value="med">Med</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 text-white text-sm font-bold px-4 py-1.5 hover:bg-violet-700 transition-colors"
              >
                Add task
              </button>
            </div>
          </form>
        )}

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => t.status === status)}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
          onDeleted={(id) => setTasks((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </>
  );
}