"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WeekScheduleView } from "@/components/tasks/week-schedule-view";
import { DoneView } from "@/components/tasks/done-view";
import { TaskForm } from "@/components/tasks/task-form";
import { getTaskStats, TaskStats } from "@/lib/api/tasks";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

type TabType = "schedule" | "done";

export default function TasksPage() {
  const router = useRouter();
  const { canEdit } = usePermissions();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("schedule");
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
      });
      setFilterUserId(payload.sub);
    } catch (error) {
      console.error("Invalid token:", error);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, filterUserId]);

  const loadStats = async () => {
    try {
      const data = await getTaskStats(filterUserId);
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleCreateTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    loadStats();
    setRefreshKey((prev) => prev + 1);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Завантаження...</div>
      </div>
    );
  }

  const scheduledCount = stats
    ? stats.byStatus.scheduled +
      stats.byStatus.todo +
      stats.byStatus.in_progress +
      stats.byStatus.backlog
    : 0;
  const doneCount = stats ? stats.byStatus.done : 0;

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Завдання</h1>
              <p className="text-muted-foreground mt-1">
                Керуйте та відстежуйте свою роботу
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterUserId || "all"}
                onChange={(e) =>
                  setFilterUserId(e.target.value === "all" ? undefined : e.target.value)
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={user.id}>Мої завдання</option>
                <option value="all">Всі завдання</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b">
            <button
              onClick={() => setActiveTab("schedule")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "schedule"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Розклад
              {scheduledCount > 0 && (
                <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {scheduledCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("done")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "done"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Виконані
              {doneCount > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  {doneCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div>
            {activeTab === "schedule" && (
              <WeekScheduleView
                key={`schedule-${refreshKey}`}
                userId={filterUserId}
                onCreateTask={canEdit ? handleCreateTask : undefined}
              />
            )}
            {activeTab === "done" && (
              <DoneView
                key={`done-${refreshKey}`}
                userId={filterUserId}
                onTaskClick={(task) => router.push(`/dashboard/tasks/${task.id}`)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal - only for users with edit permissions */}
      {canEdit && (
        <TaskForm
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
