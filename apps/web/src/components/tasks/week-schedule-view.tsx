"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  Filter,
  X,
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
import { TaskDetailModal } from "./task-detail-modal";
import { PendingTasksBanner } from "./pending-tasks-banner";
import { TaskAcceptanceModal } from "./task-acceptance-modal";
import { useOrganizationUsers } from "@/hooks/use-organization-users";
import { useProjects } from "@/hooks/use-projects";
import { useTaskSocket } from "@/hooks/use-task-socket";

interface WeekScheduleViewProps {
  userId?: string;
  onCreateTask?: () => void;
}

const HOURS_PER_DAY = 8;
const COLUMN_MIN_HEIGHT = 400;

interface TaskFilters {
  priorities: TaskPriority[];
  assigneeId: string | null;
  projectId: string | null;
  tags: string[];
}

const emptyFilters: TaskFilters = {
  priorities: [],
  assigneeId: null,
  projectId: null,
  tags: [],
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

  // Filter state
  const [filters, setFilters] = useState<TaskFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string>("");

  // Task acceptance modal state
  const [acceptanceTask, setAcceptanceTask] = useState<Task | null>(null);
  const [acceptanceModalOpen, setAcceptanceModalOpen] = useState(false);
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  // Fetch users and projects for filters
  const { users } = useOrganizationUsers();
  const { projects } = useProjects();

  // Extract all unique tags from tasks
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    Object.values(scheduledTasks).forEach((tasks) => {
      tasks.forEach((task) => task.tags?.forEach((tag) => tags.add(tag)));
    });
    backlogTasks.forEach((task) => task.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [scheduledTasks, backlogTasks]);

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

  // Get current user info from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.sub);
        setCurrentUserName(payload.name || "User");
        setOrganizationId(payload.organizationId || "");
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  // Socket event handlers for real-time updates
  const handleSocketTaskCreated = useCallback((task: Task) => {
    console.log("📥 Task created via socket:", task.title);
    // Add to backlog or scheduled based on status
    if (task.scheduledDate) {
      const dateKey = task.scheduledDate.split("T")[0];
      setScheduledTasks((prev) => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), task],
      }));
    } else {
      setBacklogTasks((prev) => [task, ...prev]);
    }
    // Refresh pending banner if task is pending acceptance for current user
    if (task.status === "pending_acceptance" && task.assignedToId === currentUserId) {
      setPendingRefreshKey((prev) => prev + 1);
    }
  }, [currentUserId]);

  const handleSocketTaskUpdated = useCallback((task: Task) => {
    console.log("📥 Task updated via socket:", task.title);
    // Update in scheduled tasks
    setScheduledTasks((prev) => {
      const newScheduled = { ...prev };
      // Remove from old date if exists
      Object.keys(newScheduled).forEach((date) => {
        newScheduled[date] = newScheduled[date].filter((t) => t.id !== task.id);
      });
      // Add to new date if scheduled
      if (task.scheduledDate) {
        const dateKey = task.scheduledDate.split("T")[0];
        newScheduled[dateKey] = [...(newScheduled[dateKey] || []), task];
      }
      return newScheduled;
    });
    // Update in backlog
    setBacklogTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== task.id);
      // Add to backlog if not scheduled and status is backlog/todo
      if (!task.scheduledDate && ["backlog", "todo"].includes(task.status)) {
        return [task, ...filtered];
      }
      return filtered;
    });
  }, []);

  const handleSocketTaskDeleted = useCallback((data: { taskId: string }) => {
    console.log("📥 Task deleted via socket:", data.taskId);
    // Remove from scheduled tasks
    setScheduledTasks((prev) => {
      const newScheduled = { ...prev };
      Object.keys(newScheduled).forEach((date) => {
        newScheduled[date] = newScheduled[date].filter((t) => t.id !== data.taskId);
      });
      return newScheduled;
    });
    // Remove from backlog
    setBacklogTasks((prev) => prev.filter((t) => t.id !== data.taskId));
  }, []);

  const handleSocketTaskStatusChanged = useCallback((task: Task) => {
    console.log("📥 Task status changed via socket:", task.title, task.status);
    handleSocketTaskUpdated(task);
    // Refresh pending banner
    setPendingRefreshKey((prev) => prev + 1);
  }, [handleSocketTaskUpdated]);

  // Setup socket listeners
  const { joinOrganization } = useTaskSocket({
    onTaskCreated: handleSocketTaskCreated,
    onTaskUpdated: handleSocketTaskUpdated,
    onTaskDeleted: handleSocketTaskDeleted,
    onTaskStatusChanged: handleSocketTaskStatusChanged,
  });

  // Join organization room for real-time updates
  useEffect(() => {
    if (organizationId && currentUserId) {
      joinOrganization(organizationId, currentUserId);
    }
  }, [organizationId, currentUserId, joinOrganization]);

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

  // Filter tasks
  const filterTask = (task: Task): boolean => {
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }
    // Assignee filter
    if (filters.assigneeId && task.assignedToId !== filters.assigneeId) {
      return false;
    }
    // Project filter
    if (filters.projectId && task.projectId !== filters.projectId) {
      return false;
    }
    // Tags filter
    if (filters.tags.length > 0) {
      const taskTags = task.tags || [];
      if (!filters.tags.some((tag) => taskTags.includes(tag))) {
        return false;
      }
    }
    return true;
  };

  // Apply filters to scheduled tasks
  const filteredScheduledTasks = useMemo(() => {
    const result: Record<string, Task[]> = {};
    Object.entries(scheduledTasks).forEach(([date, tasks]) => {
      result[date] = tasks.filter(filterTask);
    });
    return result;
  }, [scheduledTasks, filters]);

  // Calculate day hours (using filtered tasks)
  const getDayHours = (dateKey: string) => {
    const tasks = filteredScheduledTasks[dateKey] || [];
    return tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  };

  // Filter backlog with search and filters
  const filteredBacklog = useMemo(() => {
    let result = backlogTasks.filter(filterTask);
    if (backlogSearch.trim()) {
      const search = backlogSearch.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search)
      );
    }
    return result;
  }, [backlogTasks, backlogSearch, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priorities.length > 0) count++;
    if (filters.assigneeId) count++;
    if (filters.projectId) count++;
    if (filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  // Filter handlers
  const togglePriority = (priority: TaskPriority) => {
    setFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((p) => p !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  // Task click handler
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setDetailModalOpen(true);
  };

  // Task update/delete handlers
  const handleTaskUpdated = (updatedTask: Task) => {
    // Update in scheduled tasks
    setScheduledTasks((prev) => {
      const newScheduled = { ...prev };
      Object.keys(newScheduled).forEach((date) => {
        newScheduled[date] = newScheduled[date].map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        );
      });
      return newScheduled;
    });
    // Update in backlog
    setBacklogTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDeleted = (taskId: string) => {
    // Remove from scheduled tasks
    setScheduledTasks((prev) => {
      const newScheduled = { ...prev };
      Object.keys(newScheduled).forEach((date) => {
        newScheduled[date] = newScheduled[date].filter((t) => t.id !== taskId);
      });
      return newScheduled;
    });
    // Remove from backlog
    setBacklogTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Task acceptance handlers
  const handleReviewPendingTask = (task: Task) => {
    setAcceptanceTask(task);
    setAcceptanceModalOpen(true);
  };

  const handleTaskAccepted = (task: Task) => {
    // Add to backlog since accepted tasks go to backlog status
    setBacklogTasks((prev) => [task, ...prev]);
    // Trigger refresh of pending banner
    setPendingRefreshKey((prev) => prev + 1);
  };

  const handleTaskDeclined = () => {
    // Trigger refresh of pending banner
    setPendingRefreshKey((prev) => prev + 1);
  };

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
        {/* Pending Tasks Banner */}
        <PendingTasksBanner
          key={pendingRefreshKey}
          onReviewTask={handleReviewPendingTask}
        />

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

          {/* Filters Popover */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto py-1 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["low", "medium", "high", "critical"] as TaskPriority[]).map(
                      (priority) => (
                        <div key={priority} className="flex items-center gap-2">
                          <Checkbox
                            id={`priority-${priority}`}
                            checked={filters.priorities.includes(priority)}
                            onCheckedChange={() => togglePriority(priority)}
                          />
                          <Label
                            htmlFor={`priority-${priority}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {priority}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Assignee Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assignee</Label>
                  <Select
                    value={filters.assigneeId || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        assigneeId: value === "all" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All assignees</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} {user.isAI && "(AI)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Project</Label>
                  <Select
                    value={filters.projectId || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        projectId: value === "all" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                {allTags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {allTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                          {filters.tags.includes(tag) && (
                            <X className="h-3 w-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <Button
                  className="w-full"
                  onClick={() => setFiltersOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-5 gap-3">
          {weekDays.map((day) => {
            const dateKey = formatDateKey(day);
            const tasks = filteredScheduledTasks[dateKey] || [];
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
                      onTaskClick={handleTaskClick}
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
                <BacklogCard
                  key={task.id}
                  task={task}
                  onTaskClick={handleTaskClick}
                />
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

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      {/* Task Acceptance Modal */}
      <TaskAcceptanceModal
        task={acceptanceTask}
        open={acceptanceModalOpen}
        onOpenChange={setAcceptanceModalOpen}
        onTaskAccepted={handleTaskAccepted}
        onTaskDeclined={handleTaskDeclined}
      />
    </DndContext>
  );
}
