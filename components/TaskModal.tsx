"use client";

import { useEffect, useState } from "react";
import { supabase, Task, TaskPriority, TaskStatus } from "@/lib/supabase";
import { format, isPast, parseISO } from "date-fns";

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; badge: string }> = {
  todo:        { label: "To Do",       dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", dot: "bg-amber-500",   badge: "bg-amber-100 text-amber-700" },
  done:        { label: "Done",        dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; dot: string; active: string }> = {
  low:  { label: "Low",  dot: "bg-emerald-400", active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" },
  med:  { label: "Med",  dot: "bg-amber-400",   active: "bg-amber-100 text-amber-700 ring-1 ring-amber-300" },
  high: { label: "High", dot: "bg-red-500",      active: "bg-red-100 text-red-700 ring-1 ring-red-300" },
};

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
}

export default function TaskModal({
  task,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: Task;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assigneeName, setAssigneeName] = useState(task.assignee_name ?? "");
  const [labels, setLabels] = useState<string[]>(
    task.labels ? task.labels.split(",").filter(Boolean) : []
  );
  const [labelInput, setLabelInput] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | null>(task.story_points ?? null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments(data ?? []));
  }, [task.id]);

  function addLabel() {
    const label = labelInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (label && !labels.includes(label)) {
      setLabels((prev) => [...prev, label]);
    }
    setLabelInput("");
  }

  async function handleSave() {
    setSaving(true);
    const fullPayload: any = {
      title,
      description: description || null,
      priority,
      status,
      due_date: dueDate || null,
      assignee_name: assigneeName || null,
      labels: labels.length > 0 ? labels.join(",") : null,
      story_points: storyPoints,
    };

    let { data, error } = await supabase
      .from("tasks")
      .update(fullPayload)
      .eq("id", task.id)
      .select()
      .single();

    // Graceful fallback if new columns don't exist yet
    if (error) {
      const basicPayload = { title, description: description || null, priority, status, due_date: dueDate || null };
      const res = await supabase.from("tasks").update(basicPayload).eq("id", task.id).select().single();
      data = res.data;
      error = res.error;
    }

    setSaving(false);
    if (!error && data) {
      onUpdated(data);
      onClose();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (!error) {
      onDeleted(task.id);
      onClose();
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("task_comments")
      .insert({ task_id: task.id, user_id: session.user.id, comment: newComment.trim() })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setNewComment("");
    }
  }

  const statusCfg = STATUS_CONFIG[status];
  const overdue = dueDate && status !== "done" && isPast(parseISO(dueDate));

  return (
    <div
      className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">Edit task</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: title + description + comments */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 outline-none border-b-2 border-transparent focus:border-violet-500 pb-1 mb-4 transition-colors bg-transparent"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={5}
              className="w-full text-sm text-gray-600 outline-none resize-none rounded-xl border border-gray-200 bg-gray-50 p-3.5 leading-relaxed focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            />

            {/* Activity / Comments */}
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Activity</h4>
              <div className="space-y-3 mb-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                      U
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">{c.comment}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {format(new Date(c.created_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No activity yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                  placeholder="Add a comment…"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
                <button
                  onClick={handleAddComment}
                  className="rounded-xl bg-violet-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-violet-700 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          {/* Right: properties panel */}
          <div className="w-60 flex-shrink-0 overflow-y-auto bg-gray-50/80 border-l border-gray-100 px-4 py-5 space-y-5">

            {/* Status */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
              <div className="space-y-1">
                {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => {
                  const sc = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                        status === s ? `${sc.badge} font-semibold` : "text-gray-500 hover:bg-white hover:text-gray-800"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Priority</p>
              <div className="flex gap-1">
                {(["low", "med", "high"] as TaskPriority[]).map((p) => {
                  const pc = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        priority === p ? pc.active : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                      {pc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assignee</p>
              <div className="flex items-center gap-2">
                {assigneeName && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {assigneeName.charAt(0).toUpperCase()}
                  </div>
                )}
                <input
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  placeholder="Assign to…"
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Labels</p>
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {labels.map((l) => (
                    <span key={l} className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      #{l}
                      <button onClick={() => setLabels((prev) => prev.filter((x) => x !== l))} className="hover:text-red-500 ml-0.5 leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addLabel(); } }}
                placeholder="Type + Enter to add…"
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
            </div>

            {/* Story Points */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Story Points</p>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 5, 8, 13, 21].map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setStoryPoints(storyPoints === pt ? null : pt)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      storyPoints === pt
                        ? "bg-violet-600 text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
              {storyPoints != null && (
                <p className="text-[10px] text-gray-400 mt-1">{storyPoints} point{storyPoints !== 1 ? "s" : ""} estimated</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Due Date</p>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent ${
                  overdue ? "border-red-300 text-red-600" : "border-gray-200"
                }`}
              />
              {overdue && <p className="text-[10px] text-red-500 mt-1">⚠ Task is overdue</p>}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold py-2.5 hover:from-violet-700 hover:to-purple-800 disabled:opacity-50 transition-all shadow-md"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={handleDelete}
                className="w-full rounded-xl border border-red-200 text-red-500 text-sm font-medium py-2 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                Delete task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
