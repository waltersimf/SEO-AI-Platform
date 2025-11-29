"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlannedTask {
  taskId: string;
  taskTitle: string;
  suggestedDate: string;
  estimatedTime: number;
  priority: string;
  dueDate: string | null;
}

interface AutoPlanResult {
  plan: PlannedTask[];
  summary: Record<string, number>;
  weekStart: string;
  weekEnd: string;
  totalTasksPlanned: number;
  totalTasksInBacklog: number;
  message?: string;
}

interface AutoPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: AutoPlanResult | null;
  onApply: () => Promise<void>;
  isApplying: boolean;
}

const dayLabels: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDayName(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
}

export function AutoPlanModal({
  isOpen,
  onClose,
  planData,
  onApply,
  isApplying,
}: AutoPlanModalProps) {
  if (!planData) return null;

  // Group tasks by date
  const tasksByDate: Record<string, PlannedTask[]> = {};
  for (const task of planData.plan) {
    if (!tasksByDate[task.suggestedDate]) {
      tasksByDate[task.suggestedDate] = [];
    }
    tasksByDate[task.suggestedDate].push(task);
  }

  // Sort dates
  const sortedDates = Object.keys(tasksByDate).sort();

  const hasNoPlan = planData.plan.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Auto-Plan Preview
          </DialogTitle>
          <DialogDescription>
            {hasNoPlan
              ? "No tasks available to schedule"
              : `Planning ${planData.totalTasksPlanned} of ${planData.totalTasksInBacklog} backlog tasks`}
          </DialogDescription>
        </DialogHeader>

        {hasNoPlan ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{planData.message || "No unscheduled tasks found in your backlog."}</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              {Object.entries(planData.summary).map(([day, hours]) => (
                <div
                  key={day}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm",
                    hours > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="font-medium">{dayLabels[day]?.slice(0, 3)}</span>:{" "}
                  <span>{hours}h</span>
                </div>
              ))}
            </div>

            {/* Tasks by day */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(date)}
                    <span className="text-xs">
                      ({tasksByDate[date].reduce((sum, t) => sum + t.estimatedTime, 0)}h)
                    </span>
                  </h3>
                  <div className="space-y-2 pl-6">
                    {tasksByDate[date].map((task) => (
                      <div
                        key={task.taskId}
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            priorityColors[task.priority] || "bg-gray-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.taskTitle}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due: {formatDate(task.dueDate)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {task.estimatedTime}h
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </Button>
          {!hasNoPlan && (
            <Button onClick={onApply} disabled={isApplying}>
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Plan ({planData.plan.length} tasks)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
