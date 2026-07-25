"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/supabase";
import { format, isPast, parseISO } from "date-fns";

const PRIORITY_CONFIG: Record<Task["priority"], {
  border: string;
  badge: string;
  label: string;
}> = {
  low:  { border: "border-l-emerald-400", badge: "bg-emerald-50 text-emerald-700", label: "Low"  },
  med:  { border: "border-l-amber-400",   badge: "bg-amber-50 text-amber-700",     label: "Med"  },
  high: { border: "border-l-red-500",     badge: "bg-red-50 text-red-600",         label: "High" },
};

const LABEL_COLORS = [
  "bg-violet-50 text-violet-700",
  "bg-sky-50 text-sky-700",
  "bg-rose-50 text-rose-700",
  "bg-teal-50 text-teal-700",
  "bg-orange-50 text-orange-700",
];

export default function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = task.due_date && task.status !== "done" && isPast(parseISO(task.due_date));
  const cfg = PRIORITY_CONFIG[task.priority];
  const labelList = task.labels ? task.labels.split(",").filter(Boolean) : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing rounded-xl border-l-4 ${cfg.border} border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group`}
    >
      {/* Title + priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-violet-700 transition-colors flex-1">
          {task.title}
        </p>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Labels */}
      {labelList.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2.5">
          {labelList.slice(0, 3).map((l, i) => (
            <span key={l} className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${LABEL_COLORS[i % LABEL_COLORS.length]}`}>
              #{l}
            </span>
          ))}
          {labelList.length > 3 && (
            <span className="text-[9px] text-gray-400">+{labelList.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: story points, due date, assignee */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.story_points != null && (
          <span className="text-[9px] font-bold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded border border-violet-100">
            {task.story_points}pt
          </span>
        )}
        {task.due_date && (
          <span className={`flex items-center gap-0.5 text-[10px] font-medium ${overdue ? "text-red-500" : "text-gray-400"}`}>
            {overdue && <span>⚠</span>}
            {format(parseISO(task.due_date), "MMM d")}
          </span>
        )}
        {task.assignee_name && (
          <div
            className="ml-auto w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
            title={task.assignee_name}
          >
            {task.assignee_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
