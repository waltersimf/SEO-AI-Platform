"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const weeks = planData?.weeks || [];

  // Group tasks by week, then by date
  const tasksByWeekAndDate = useMemo(() => {
    const result: Record<string, Record<string, PlannedTask[]>> = {};
    if (!planData) return result;

    for (const week of weeks) {
      result[week.weekStart] = {};
    }

    for (const task of planData.plan) {
      const week = getWeekForDate(task.suggestedDate, weeks);
      if (week) {
        if (!result[week.weekStart]) {
          result[week.weekStart] = {};
        }
        if (!result[week.weekStart][task.suggestedDate]) {
          result[week.weekStart][task.suggestedDate] = [];
        }
        result[week.weekStart][task.suggestedDate].push(task);
      }
    }

    return result;
  }, [planData, weeks]);

  // Calculate hours per week
  const hoursPerWeek = useMemo(() => {
    const result: Record<string, number> = {};
    for (const week of weeks) {
      result[week.weekStart] = 0;
      const weekDates = tasksByWeekAndDate[week.weekStart] || {};
      for (const tasks of Object.values(weekDates)) {
        result[week.weekStart] += tasks.reduce((sum, t) => sum + t.estimatedTime, 0);
      }
    }
    return result;
  }, [weeks, tasksByWeekAndDate]);

  // Find first week with tasks
  const firstWeekWithTasks = useMemo(() => {
    for (const week of weeks) {
      if (hoursPerWeek[week.weekStart] > 0) {
        return week.weekStart;
      }
    }
    return weeks[0]?.weekStart || null;
  }, [weeks, hoursPerWeek]);

  // Set default selected week when modal opens or data changes
  useEffect(() => {
    if (isOpen && firstWeekWithTasks) {
      setSelectedWeek(firstWeekWithTasks);
    }
  }, [isOpen, firstWeekWithTasks]);

  if (!planData) return null;

  const hasNoPlan = planData.plan.length === 0;

  // Get current week's data
  const currentWeek = weeks.find((w) => w.weekStart === selectedWeek);
  const currentWeekDates = selectedWeek ? tasksByWeekAndDate[selectedWeek] || {} : {};
  const sortedDates = Object.keys(currentWeekDates).sort();

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
            {/* Week Selector Buttons */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              {weeks.map((week) => (
                <button
                  key={week.weekStart}
                  onClick={() => setSelectedWeek(week.weekStart)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    selectedWeek === week.weekStart
                      ? "bg-primary text-primary-foreground"
                      : hoursPerWeek[week.weekStart] > 0
                        ? "bg-muted hover:bg-muted/80 text-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {week.label}: {hoursPerWeek[week.weekStart]}h
                </button>
              ))}
            </div>

            {/* Tasks for selected week */}
            <div className="flex-1 overflow-y-auto py-4">
              {currentWeek && sortedDates.length > 0 ? (
                <div className="space-y-4">
                  {/* Week Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {currentWeek.label}
                    </h2>
                    <Badge variant="secondary">
                      {hoursPerWeek[selectedWeek!]}h total
                    </Badge>
                  </div>

                  {/* Days in selected week */}
                  <div className="space-y-4">
                    {sortedDates.map((date) => (
                      <div key={date} className="space-y-2">
                        <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                          {formatDate(date)}
                          <span className="text-xs">
                            ({currentWeekDates[date].reduce((sum, t) => sum + t.estimatedTime, 0)}h)
                          </span>
                        </h3>
                        <div className="space-y-2 pl-4">
                          {currentWeekDates[date].map((task) => (
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
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No tasks scheduled for this week</p>
                </div>
              )}
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
