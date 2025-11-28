"use client";

import { useEffect, useState } from "react";
import { Task, getTasks } from "@/lib/api/tasks";
import { TaskCard } from "./task-card";
import { CheckCircle2 } from "lucide-react";

interface DoneViewProps {
  userId?: string;
  onTaskClick?: (task: Task) => void;
}

interface CompletionGroup {
  label: string;
  tasks: Task[];
}

export function DoneView({ userId, onTaskClick }: DoneViewProps) {
  const [groups, setGroups] = useState<CompletionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompletedTasks();
  }, [userId]);

  const loadCompletedTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = { status: "done" };
      if (userId) {
        filters.assignedToId = userId;
      }

      const tasks = await getTasks(filters);

      // Group by completion date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const groupedTasks: Record<string, Task[]> = {
        Today: [],
        Yesterday: [],
        "This Week": [],
        Older: [],
      };

      tasks.forEach((task) => {
        const completedAt = task.completedAt
          ? new Date(task.completedAt)
          : new Date(task.updatedAt);
        completedAt.setHours(0, 0, 0, 0);

        if (completedAt.getTime() === today.getTime()) {
          groupedTasks.Today.push(task);
        } else if (completedAt.getTime() === yesterday.getTime()) {
          groupedTasks.Yesterday.push(task);
        } else if (completedAt.getTime() > weekAgo.getTime()) {
          groupedTasks["This Week"].push(task);
        } else {
          groupedTasks.Older.push(task);
        }
      });

      // Convert to array and filter empty groups
      const groupArray: CompletionGroup[] = Object.entries(groupedTasks)
        .filter(([_, tasks]) => tasks.length > 0)
        .map(([label, tasks]) => ({
          label,
          tasks: tasks.sort((a, b) => {
            const dateA = new Date(a.completedAt || a.updatedAt);
            const dateB = new Date(b.completedAt || b.updatedAt);
            return dateB.getTime() - dateA.getTime();
          }),
        }));

      setGroups(groupArray);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load completed tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading completed tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">No completed tasks</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Completed tasks will appear here
        </p>
      </div>
    );
  }

  const totalTasks = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {totalTasks} completed task{totalTasks !== 1 ? "s" : ""}
      </div>

      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="font-semibold text-sm mb-3">{group.label}</h3>
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
