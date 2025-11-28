"use client";

import Link from "next/link";
import { Task, TaskPriority, TaskStatus } from "@/lib/api/tasks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  showProject?: boolean;
  linkToDetail?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusColors: Record<TaskStatus, string> = {
  backlog: "bg-slate-100 text-slate-700",
  scheduled: "bg-purple-100 text-purple-700",
  todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  blocked: "bg-red-100 text-red-700",
  paused: "bg-orange-100 text-orange-700",
  done: "bg-green-100 text-green-700",
  wont_do: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  scheduled: "Scheduled",
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  paused: "Paused",
  done: "Done",
  wont_do: "Won't Do",
};

export function TaskCard({ task, onClick, showProject = true, linkToDetail = true }: TaskCardProps) {
  const formatTime = (hours?: number) => {
    if (!hours) return null;
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{task.title}</h3>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <Badge className={cn("text-xs shrink-0", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant="outline" className={cn("text-xs", statusColors[task.status])}>
          {statusLabels[task.status]}
        </Badge>

        {showProject && task.project && (
          <Badge variant="outline" className="text-xs">
            {task.project.name}
          </Badge>
        )}

        {task.estimatedTime && (
          <span className="text-xs text-muted-foreground">
            Est: {formatTime(task.estimatedTime)}
          </span>
        )}

        {task.actualTime && task.actualTime > 0 && (
          <span className="text-xs text-muted-foreground">
            Actual: {formatTime(task.actualTime)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {task.assignedTo && (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground">
                {task.assignedTo.name}
              </span>
            </div>
          )}
          {task.createdBy && task.createdById !== task.assignedToId && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">from</span>
              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                {task.createdBy.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground">
                {task.createdBy.name}
              </span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-1.5 py-0.5 bg-muted rounded"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </>
  );

  const cardClassName = cn(
    "rounded-lg border bg-card p-4 transition-all hover:shadow-md block",
    (onClick || linkToDetail) && "cursor-pointer hover:border-primary/50"
  );

  if (linkToDetail) {
    return (
      <Link href={`/dashboard/tasks/${task.id}`} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={cardClassName}>
      {cardContent}
    </div>
  );
}
