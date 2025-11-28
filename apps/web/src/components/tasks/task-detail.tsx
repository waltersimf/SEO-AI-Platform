"use client";

import { Task, TaskStatus, TaskPriority, changeTaskStatus } from "@/lib/api/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  Calendar,
  User,
  UserPlus,
  Folder,
  Tag,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface TaskDetailProps {
  task: Task;
  currentUserId: string;
  onStatusChange?: (task: Task) => void;
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

export function TaskDetail({ task, currentUserId, onStatusChange }: TaskDetailProps) {
  const [changingStatus, setChangingStatus] = useState(false);

  // Determine relationship to task
  const isAssignee = currentUserId === task.assignedToId;
  const isCreator = currentUserId === task.createdById;

  const formatTime = (hours?: number) => {
    if (!hours) return "Not set";
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    return `${hours.toFixed(1)} hours`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setChangingStatus(true);
    try {
      const updatedTask = await changeTaskStatus(task.id, newStatus);
      onStatusChange?.(updatedTask);
    } catch (error) {
      console.error("Failed to change status:", error);
    } finally {
      setChangingStatus(false);
    }
  };

  const renderStatusActions = () => {
    if (changingStatus) {
      return (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </Button>
      );
    }

    switch (task.status) {
      case "backlog":
      case "scheduled":
      case "todo":
        return (
          <Button onClick={() => handleStatusChange("in_progress")}>
            <Play className="mr-2 h-4 w-4" />
            Start Working
          </Button>
        );
      case "in_progress":
        return (
          <div className="flex gap-2">
            <Button onClick={() => handleStatusChange("done")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange("paused")}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          </div>
        );
      case "paused":
        return (
          <div className="flex gap-2">
            <Button onClick={() => handleStatusChange("in_progress")}>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button variant="outline" onClick={() => handleStatusChange("done")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          </div>
        );
      case "blocked":
        return (
          <Button onClick={() => handleStatusChange("in_progress")}>
            <Play className="mr-2 h-4 w-4" />
            Unblock & Continue
          </Button>
        );
      case "done":
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Completed {formatDateTime(task.completedAt)}
          </div>
        );
      case "wont_do":
        return (
          <div className="text-sm text-muted-foreground">
            This task was marked as won&apos;t do
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with title and badges */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="flex gap-2 shrink-0">
            <Badge className={cn("text-sm", priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={cn("text-sm", statusColors[task.status])}>
              {statusLabels[task.status]}
            </Badge>
          </div>
        </div>

        {task.description && (
          <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
        )}
      </div>

      {/* Status Actions */}
      <div className="p-4 rounded-lg bg-muted/50 border">
        <h3 className="text-sm font-medium mb-3">Actions</h3>
        {renderStatusActions()}
      </div>

      {/* Task Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conditional: Show Assignee if creator, Show Created by if assignee, Show both otherwise */}
        {isAssignee ? (
          // Current user is the assignee - show who created the task
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <UserPlus className="h-4 w-4" />
              Created by
            </div>
            {task.createdBy ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                  {task.createdBy.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{task.createdBy.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.createdBy.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Unknown</div>
            )}
          </div>
        ) : isCreator ? (
          // Current user is the creator - show who is assigned
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              Assignee
            </div>
            {task.assignedTo ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {task.assignedTo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{task.assignedTo.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {task.assignedTo.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Unassigned</div>
            )}
          </div>
        ) : (
          // Current user is neither - show both
          <>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <User className="h-4 w-4" />
                Assignee
              </div>
              {task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{task.assignedTo.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.assignedTo.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Unassigned</div>
              )}
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <UserPlus className="h-4 w-4" />
                Created by
              </div>
              {task.createdBy ? (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                    {task.createdBy.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{task.createdBy.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.createdBy.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Unknown</div>
              )}
            </div>
          </>
        )}

        {/* Project */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Folder className="h-4 w-4" />
            Project
          </div>
          {task.project ? (
            <div>
              <div className="font-medium">{task.project.name}</div>
              <div className="text-xs text-muted-foreground">{task.project.domain}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">No project</div>
          )}
        </div>

        {/* Due Date */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            Due Date
          </div>
          <div className={cn(
            "font-medium",
            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done"
              ? "text-red-600"
              : ""
          )}>
            {formatDate(task.dueDate) || "Not set"}
          </div>
          {task.scheduledDate && (
            <div className="text-xs text-muted-foreground mt-1">
              Scheduled: {formatDate(task.scheduledDate)}
            </div>
          )}
        </div>

        {/* Time Tracking */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            Time Tracking
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm">Estimated:</span>
              <span className="font-medium">{formatTime(task.estimatedTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Actual:</span>
              <span className="font-medium">{formatTime(task.actualTime)}</span>
            </div>
            {task.estimatedTime && task.actualTime && (
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    task.actualTime <= task.estimatedTime
                      ? "bg-green-500"
                      : "bg-red-500"
                  )}
                  style={{
                    width: `${Math.min((task.actualTime / task.estimatedTime) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Tag className="h-4 w-4" />
            Tags
          </div>
          <div className="flex gap-2 flex-wrap">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
        <div>Created: {formatDateTime(task.createdAt)}</div>
        <div>Last updated: {formatDateTime(task.updatedAt)}</div>
        {task.acceptedAt && <div>Accepted: {formatDateTime(task.acceptedAt)}</div>}
        {task.declinedAt && (
          <div>
            Declined: {formatDateTime(task.declinedAt)}
            {task.declineReason && ` - ${task.declineReason}`}
          </div>
        )}
      </div>
    </div>
  );
}
