"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import {
  Task,
  TaskPriority,
  getSchedule,
  getBacklog,
  scheduleTask,
  updateTask,
} from "@/lib/api/tasks";
import { DraggableTaskCard, DroppableDay, BacklogCard } from "./week-schedule-cards";

interface WeekScheduleViewProps {
  userId?: string;
  onCreateTask?: () => void;
}

const HOURS_PER_DAY = 8;
const COLUMN_MIN_HEIGHT = 400;

const priorityColors: Record<TaskPriority, string> = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

export function WeekScheduleView({ userId, onCreateTask }: WeekScheduleViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(today.setDate(diff));
  });

  const [scheduledTasks, setScheduledTasks] = useState<Record<string, Task[]>>({});
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [backlogSearch, setBacklogSearch] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get week days (Mon-Fri)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  // Format functions
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Load data
  useEffect(() => {
    loadData();
  }, [currentWeekStart, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);

      const [scheduleData, backlogData] = await Promise.all([
        getSchedule(formatDateKey(currentWeekStart), formatDateKey(weekEnd), userId),
        getBacklog(userId),
      ]);

      setScheduledTasks(scheduleData.grouped || {});
      setBacklogTasks(backlogData);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation
  const goToPrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  // Calculate day hours
  const getDayHours = (dateKey: string) => {
    const tasks = scheduledTasks[dateKey] || [];
    return tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  };

  // Filter backlog
  const filteredBacklog = useMemo(() => {
    if (!backlogSearch.trim()) return backlogTasks;
    const search = backlogSearch.toLowerCase();
    return backlogTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
    );
  }, [backlogTasks, backlogSearch]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;

    // Find task in scheduled or backlog
    let task: Task | undefined;
    for (const tasks of Object.values(scheduledTasks)) {
      task = tasks.find((t) => t.id === taskId);
      if (task) break;
    }
    if (!task) {
      task = backlogTasks.find((t) => t.id === taskId);
    }

    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverId(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetId = over.id as string;

    // Find the task
    let task: Task | undefined;
    let sourceDate: string | null = null;

    for (const [date, tasks] of Object.entries(scheduledTasks)) {
      task = tasks.find((t) => t.id === taskId);
      if (task) {
        sourceDate = date;
        break;
      }
    }
    if (!task) {
      task = backlogTasks.find((t) => t.id === taskId);
    }

    if (!task) return;

    // Determine target
    if (targetId === "backlog") {
      // Move to backlog
      if (sourceDate) {
        try {
          await updateTask(taskId, { scheduledDate: undefined, status: "backlog" });
          loadData();
        } catch (error) {
          console.error("Failed to move to backlog:", error);
        }
      }
    } else if (targetId.startsWith("day-")) {
      // Move to specific day
      const targetDate = targetId.replace("day-", "");
      if (sourceDate !== targetDate) {
        try {
          await scheduleTask(taskId, targetDate);
          loadData();
        } catch (error) {
          console.error("Failed to schedule task:", error);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">{formatMonthYear(currentWeekStart)}</h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={goToPrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-5 gap-3">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const tasks = scheduledTasks[dateKey] || [];
            const totalHours = getDayHours(dateKey);
            const isOverloaded = totalHours > HOURS_PER_DAY;
            const fillPercent = Math.min((totalHours / HOURS_PER_DAY) * 100, 100);

            return (
              <DroppableDay
                key={dateKey}
                id={`day-${dateKey}`}
                isOver={overId === `day-${dateKey}`}
              >
                {/* Day Header */}
                <div className={cn(
                  "p-3 rounded-t-lg border-b",
                  isToday(day) ? "bg-primary/10" : "bg-muted/50"
                )}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    )}>
                      {formatDayName(day)}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isOverloaded ? "text-red-600 font-medium" : "text-muted-foreground"
                    )}>
                      {totalHours.toFixed(1)}h / {HOURS_PER_DAY}h
                    </span>
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    isToday(day) ? "text-primary" : ""
                  )}>
                    {day.getDate()}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isOverloaded ? "bg-red-500" : "bg-primary"
                      )}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>

                {/* Tasks */}
                <div
                  className="p-2 space-y-2 overflow-y-auto"
                  style={{ minHeight: COLUMN_MIN_HEIGHT }}
                >
                  {tasks.map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      columnHeight={COLUMN_MIN_HEIGHT}
                    />
                  ))}
                  {tasks.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </DroppableDay>
            );
          })}
        </div>

        {/* New Task Button */}
        <div className="flex justify-center">
          <Button onClick={onCreateTask} className="rounded-full px-6">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Backlog Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Backlog</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search backlog..."
                value={backlogSearch}
                onChange={(e) => setBacklogSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <DroppableDay id="backlog" isOver={overId === "backlog"} isBacklog>
            <div className="grid grid-cols-4 gap-3 p-2 min-h-[150px]">
              {filteredBacklog.map((task) => (
                <BacklogCard key={task.id} task={task} />
              ))}
              {filteredBacklog.length === 0 && backlogSearch && (
                <div className="col-span-4 py-8 text-center text-muted-foreground text-sm">
                  No tasks match your search
                </div>
              )}
              {filteredBacklog.length === 0 && !backlogSearch && (
                <div className="col-span-4 py-8 text-center text-muted-foreground text-sm">
                  No tasks in backlog
                </div>
              )}
              {/* Add to Backlog placeholder */}
              <button
                onClick={onCreateTask}
                className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[100px]"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">Add to Backlog</span>
              </button>
            </div>
          </DroppableDay>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <div className="bg-card border rounded-lg shadow-lg p-3 opacity-90 w-48">
            <div className="font-medium text-sm truncate">{activeTask.title}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {activeTask.estimatedTime || 0}h
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
