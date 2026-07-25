"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/lib/supabase";
import TaskCard from "./TaskCard";

const COLUMN_CONFIG: Record<TaskStatus, {
  label: string;
  headerGrad: string;
  bgColor: string;
  dropBg: string;
  icon: string;
}> = {
  todo: {
    label: "To Do",
    headerGrad: "from-blue-500 to-indigo-600",
    bgColor: "bg-slate-50",
    dropBg: "bg-blue-50 ring-2 ring-inset ring-blue-200",
    icon: "○",
  },
  in_progress: {
    label: "In Progress",
    headerGrad: "from-amber-500 to-orange-600",
    bgColor: "bg-slate-50",
    dropBg: "bg-amber-50 ring-2 ring-inset ring-amber-200",
    icon: "◑",
  },
  done: {
    label: "Done",
    headerGrad: "from-emerald-500 to-teal-600",
    bgColor: "bg-slate-50",
    dropBg: "bg-emerald-50 ring-2 ring-inset ring-emerald-200",
    icon: "●",
  },
};

export default function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = COLUMN_CONFIG[status];

  return (
    <div className="flex-1 min-w-[300px] flex flex-col rounded-2xl overflow-hidden shadow-sm border border-gray-200/80">
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${cfg.headerGrad} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">{cfg.icon}</span>
          <h3 className="text-sm font-bold text-white tracking-wide">{cfg.label}</h3>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/25 text-white">
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[200px] p-3 transition-all ${
          isOver ? cfg.dropBg : cfg.bgColor
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-gray-300 text-lg leading-none">+</span>
            </div>
            <p className="text-[11px] text-gray-400">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}
