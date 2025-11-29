"use client";

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

interface WeekInfo {
  weekStart: string;
  weekEnd: string;
  label: string;
}

interface AutoPlanResult {
  plan: PlannedTask[];
  summaryByDate: Record<string, number>;
  weeks: WeekInfo[];
  planStart: string;
  planEnd: string;
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

const priorityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T12:00:00"); // Avoid timezone issues
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getWeekForDate(dateString: string, weeks: WeekInfo[]): WeekInfo | undefined {
  for (const week of weeks) {
    if (dateString >= week.weekStart && dateString <= week.weekEnd) {
      return week;
    }
  }
  return weeks[0]; // fallback
}

export function AutoPlanModal({
  isOpen,
  onClose,
  planData,
  onApply,
  isApplying,
}: AutoPlanModalProps) {
  if (!planData) return null;

  const weeks = planData.weeks || [];

  // Group tasks by week, then by date
  const tasksByWeekAndDate: Record<string, Record<string, PlannedTask[]>> = {};
  for (const week of weeks) {
    tasksByWeekAndDate[week.weekStart] = {};
  }

  for (const task of planData.plan) {
    const week = getWeekForDate(task.suggestedDate, weeks);
    if (week) {
      if (!tasksByWeekAndDate[week.weekStart]) {
        tasksByWeekAndDate[week.weekStart] = {};
      }
      if (!tasksByWeekAndDate[week.weekStart][task.suggestedDate]) {
        tasksByWeekAndDate[week.weekStart][task.suggestedDate] = [];
      }
      tasksByWeekAndDate[week.weekStart][task.suggestedDate].push(task);
    }
  }

  // Calculate hours per week
  const hoursPerWeek: Record<string, number> = {};
  for (const week of weeks) {
    hoursPerWeek[week.weekStart] = 0;
    const weekDates = tasksByWeekAndDate[week.weekStart] || {};
    for (const tasks of Object.values(weekDates)) {
      hoursPerWeek[week.weekStart] += tasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    }
  }

  const hasNoPlan = planData.plan.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Auto-Plan Preview
          </DialogTitle>
          <DialogDescription>
            {hasNoPlan
              ? "No tasks available to schedule"
              : `Planning ${planData.totalTasksPlanned} of ${planData.totalTasksInBacklog} backlog tasks across ${weeks.length} weeks`}
          </DialogDescription>
        </DialogHeader>

        {hasNoPlan ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{planData.message || "No unscheduled tasks found in your backlog."}</p>
          </div>
        ) : (
          <>
            {/* Week Summary */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              {weeks.map((week) => (
                <div
                  key={week.weekStart}
                  className={cn(
                    "px-3 py-1 rounded-md text-sm",
                    hoursPerWeek[week.weekStart] > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="font-medium">{week.label}</span>:{" "}
                  <span>{hoursPerWeek[week.weekStart]}h</span>
                </div>
              ))}
            </div>

            {/* Tasks by week and day */}
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {weeks.map((week) => {
                const weekDates = tasksByWeekAndDate[week.weekStart] || {};
                const sortedDates = Object.keys(weekDates).sort();

                if (sortedDates.length === 0) return null;

                return (
                  <div key={week.weekStart} className="space-y-3">
                    {/* Week Header */}
                    <h2 className="font-semibold text-sm flex items-center gap-2 sticky top-0 bg-background py-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {week.label}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {hoursPerWeek[week.weekStart]}h total
                      </Badge>
                    </h2>

                    {/* Days in this week */}
                    <div className="space-y-3 pl-2">
                      {sortedDates.map((date) => (
                        <div key={date} className="space-y-2">
                          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                            {formatDate(date)}
                            <span className="text-xs">
                              ({weekDates[date].reduce((sum, t) => sum + t.estimatedTime, 0)}h)
                            </span>
                          </h3>
                          <div className="space-y-2 pl-4">
                            {weekDates[date].map((task) => (
                              <div
                                key={task.taskId}
                                className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                              >
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
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
                                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                  <Clock className="h-3 w-3" />
                                  {task.estimatedTime}h
                                </div>
                                <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                                  {task.priority}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
