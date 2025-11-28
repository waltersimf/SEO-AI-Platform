"use client";

import { useEffect, useState } from "react";
import { Task, getSchedule } from "@/lib/api/tasks";
import { TaskCard } from "./task-card";
import { AlertTriangle, Calendar } from "lucide-react";

interface ScheduleViewProps {
  userId?: string;
  onTaskClick?: (task: Task) => void;
}

interface DayGroup {
  date: string;
  dateObj: Date;
  tasks: Task[];
  totalHours: number;
}

export function ScheduleView({ userId, onTaskClick }: ScheduleViewProps) {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchedule();
  }, [userId]);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get schedule for next 14 days
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const dateFrom = today.toISOString().split("T")[0];
      const dateTo = twoWeeksLater.toISOString().split("T")[0];

      const response = await getSchedule(dateFrom, dateTo, userId);

      // Convert grouped object to sorted array
      const groupArray: DayGroup[] = Object.entries(response.grouped)
        .map(([date, tasks]) => {
          const totalHours = tasks.reduce(
            (sum, task) => sum + (task.estimatedTime || 0),
            0
          );
          return {
            date,
            dateObj: new Date(date),
            tasks,
            totalHours,
          };
        })
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      setGroups(groupArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const formatDayHeader = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (diffDays === 0) return `Today, ${monthDay}`;
    if (diffDays === 1) return `Tomorrow, ${monthDay}`;
    return `${dayName}, ${monthDay}`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading schedule...</div>
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
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">No scheduled tasks</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Tasks from your backlog will appear here once scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">
              {formatDayHeader(group.dateObj)}
            </h3>
            <div className="flex items-center gap-2">
              {group.totalHours > 8 && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span
                className={`text-sm ${
                  group.totalHours > 8
                    ? "text-yellow-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {formatHours(group.totalHours)} / 8h
              </span>
            </div>
          </div>
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
