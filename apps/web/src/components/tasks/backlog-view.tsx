"use client";

import { useEffect, useState } from "react";
import { Task, getBacklog } from "@/lib/api/tasks";
import { TaskCard } from "./task-card";
import { Inbox } from "lucide-react";

interface BacklogViewProps {
  userId?: string;
  onTaskClick?: (task: Task) => void;
}

export function BacklogView({ userId, onTaskClick }: BacklogViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBacklog();
  }, [userId]);

  const loadBacklog = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBacklog(userId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load backlog");
    } finally {
      setLoading(false);
    }
  };

  const totalEstimatedHours = tasks.reduce(
    (sum, task) => sum + (task.estimatedTime || 0),
    0
  );

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading backlog...</div>
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

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">Backlog is empty</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Create new tasks to add them to your backlog
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{tasks.length} tasks</span>
        <span>Total: {formatHours(totalEstimatedHours)}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
      </div>
    </div>
  );
}
