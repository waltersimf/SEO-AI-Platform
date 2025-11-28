"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskTabs } from "@/components/tasks/task-tabs";
import { ScheduleView } from "@/components/tasks/schedule-view";
import { BacklogView } from "@/components/tasks/backlog-view";
import { DoneView } from "@/components/tasks/done-view";
import { TaskForm } from "@/components/tasks/task-form";
import { Task, getTaskStats, TaskStats } from "@/lib/api/tasks";

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "backlog" | "done">(
    "schedule"
  );
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filterUserId, setFilterUserId] = useState<string | undefined>(
    undefined
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
      });
      // Default to showing only current user's tasks
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

  const handleTaskClick = (task: Task) => {
    // TODO: Open task detail modal or navigate to task page
    console.log("Task clicked:", task);
  };

  const handleCreateTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    // Refresh stats and views
    loadStats();
    setRefreshKey((prev) => prev + 1);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const scheduledCount = stats
    ? stats.byStatus.scheduled + stats.byStatus.todo + stats.byStatus.in_progress
    : 0;
  const backlogCount = stats ? stats.byStatus.backlog : 0;
  const doneCount = stats ? stats.byStatus.done : 0;

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                <p className="text-muted-foreground mt-1">
                  Manage and track your work
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={filterUserId || "all"}
                  onChange={(e) =>
                    setFilterUserId(
                      e.target.value === "all" ? undefined : e.target.value
                    )
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value={user.id}>My Tasks</option>
                  <option value="all">All Tasks</option>
                </select>
              </div>
            </div>

            {/* Tabs */}
            <TaskTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              scheduledCount={scheduledCount}
              backlogCount={backlogCount}
              doneCount={doneCount}
            />

            {/* Content */}
            <div className="min-h-[400px]">
              {activeTab === "schedule" && (
                <ScheduleView
                  key={`schedule-${refreshKey}`}
                  userId={filterUserId}
                  onTaskClick={handleTaskClick}
                />
              )}
              {activeTab === "backlog" && (
                <BacklogView
                  key={`backlog-${refreshKey}`}
                  userId={filterUserId}
                  onTaskClick={handleTaskClick}
                />
              )}
              {activeTab === "done" && (
                <DoneView
                  key={`done-${refreshKey}`}
                  userId={filterUserId}
                  onTaskClick={handleTaskClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleCreateTask}
        size="icon"
        className="fixed bottom-24 right-8 h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Task Modal */}
      <TaskForm
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
