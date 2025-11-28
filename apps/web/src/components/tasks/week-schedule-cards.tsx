"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Task, TaskPriority } from "@/lib/api/tasks";

const HOURS_PER_DAY = 8;

const priorityBorderColors: Record<TaskPriority, string> = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

const priorityBgColors: Record<TaskPriority, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

interface DraggableTaskCardProps {
  task: Task;
  columnHeight: number;
}

export function DraggableTaskCard({ task, columnHeight }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Calculate proportional height based on estimated time
  const estimatedHours = task.estimatedTime || 1;
  const proportionalHeight = Math.max(
    60, // Min height
    Math.min(
      columnHeight * 0.8, // Max 80% of column
      (estimatedHours / HOURS_PER_DAY) * columnHeight
    )
  );

  return (
    <Link href={`/dashboard/tasks/${task.id}`}>
      <div
        ref={setNodeRef}
        style={{ ...style, height: proportionalHeight }}
        {...listeners}
        {...attributes}
        className={cn(
          "bg-card border border-l-4 rounded-lg p-2 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md flex flex-col",
          priorityBorderColors[task.priority],
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        {/* Assignee name */}
        {task.assignedTo && (
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
            {task.assignedTo.name}
          </div>
        )}

        {/* Title */}
        <div className="font-medium text-sm mt-0.5 line-clamp-2 flex-1">
          {task.title}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{estimatedHours}h</span>
          </div>
          {task.assignedTo && (
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
              {task.assignedTo.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface BacklogCardProps {
  task: Task;
}

export function BacklogCard({ task }: BacklogCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Link href={`/dashboard/tasks/${task.id}`}>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md h-full min-h-[100px]",
          isDragging && "opacity-50 shadow-lg"
        )}
      >
        {/* Priority badge */}
        <Badge className={cn("text-[10px] mb-2", priorityBgColors[task.priority])}>
          {task.priority}
        </Badge>

        {/* Assignee */}
        {task.assignedTo && (
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate mb-1">
            {task.assignedTo.name}
          </div>
        )}

        {/* Title */}
        <div className="font-medium text-sm line-clamp-2 mb-2">{task.title}</div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{task.estimatedTime || 0}h</span>
          </div>
          {task.assignedTo && (
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
              {task.assignedTo.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface DroppableDayProps {
  id: string;
  isOver: boolean;
  isBacklog?: boolean;
  children: React.ReactNode;
}

export function DroppableDay({ id, isOver, isBacklog, children }: DroppableDayProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border transition-colors",
        isBacklog ? "bg-muted/30" : "bg-card",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      {children}
    </div>
  );
}
