'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { API_URL } from '@/config/api';
import { cn } from '@/lib/utils';

interface PlannedTask {
  taskId: string;
  taskTitle: string;
  suggestedDate: string;
  estimatedTime: number;
  priority: string;
  dueDate: string | null;
}

interface UnscheduledTask {
  taskId: string;
  taskTitle: string;
  estimatedTime: number;
  reason: string;
}

interface WeekInfo {
  weekStart: string;
  weekEnd: string;
  label: string;
}

interface AutoPlanPreviewData {
  type: 'auto_plan_preview';
  plan: PlannedTask[];
  weeks: WeekInfo[];
  summaryByDate: Record<string, number>;
  planStart: string;
  planEnd: string;
  totalTasksPlanned: number;
  totalTasksInBacklog: number;
  unscheduledTasks: UnscheduledTask[];
  status: 'pending' | 'applied';
}

interface AutoPlanAppliedInfo {
  tasksApplied: number;
}

interface AutoPlanPreviewCardProps {
  planData: AutoPlanPreviewData;
  onPlanApplied?: (info: AutoPlanAppliedInfo) => void;
  onDismiss?: () => void;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getWeekForDate(dateString: string, weeks: WeekInfo[]): WeekInfo | undefined {
  for (const week of weeks) {
    if (dateString >= week.weekStart && dateString <= week.weekEnd) {
      return week;
    }
  }
  return weeks[0];
}

export function AutoPlanPreviewCard({
  planData,
  onPlanApplied,
  onDismiss,
}: AutoPlanPreviewCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(
    planData.weeks[0]?.weekStart || null
  );

  // Group tasks by week
  const tasksByWeek: Record<string, Record<string, PlannedTask[]>> = {};
  for (const week of planData.weeks) {
    tasksByWeek[week.weekStart] = {};
  }

  for (const task of planData.plan) {
    const week = getWeekForDate(task.suggestedDate, planData.weeks);
    if (week) {
      if (!tasksByWeek[week.weekStart]) {
        tasksByWeek[week.weekStart] = {};
      }
      if (!tasksByWeek[week.weekStart][task.suggestedDate]) {
        tasksByWeek[week.weekStart][task.suggestedDate] = [];
      }
      tasksByWeek[week.weekStart][task.suggestedDate].push(task);
    }
  }

  // Calculate hours per week
  const hoursPerWeek: Record<string, number> = {};
  for (const week of planData.weeks) {
    hoursPerWeek[week.weekStart] = 0;
    const weekDates = tasksByWeek[week.weekStart] || {};
    for (const tasks of Object.values(weekDates)) {
      hoursPerWeek[week.weekStart] += tasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    }
  }

  const handleApplyPlan = async () => {
    if (planData.plan.length === 0) {
      setError('No tasks to apply');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/apply-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planData.plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply plan');
      }

      setIsApplied(true);

      onPlanApplied?.({
        tasksApplied: planData.plan.length,
      });
    } catch (err) {
      console.error('Error applying plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply plan');
    } finally {
      setIsApplying(false);
    }
  };

  if (isApplied) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">
            Plan applied! {planData.totalTasksPlanned} tasks scheduled.
          </span>
        </div>
        <a
          href="/dashboard/tasks"
          className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 hover:text-green-700 underline"
        >
          View Schedule
        </a>
      </div>
    );
  }

  if (planData.totalTasksPlanned === 0) {
    return (
      <div className="bg-muted border rounded-lg p-4 mt-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-5 w-5" />
          <span>No tasks available to plan</span>
        </div>
      </div>
    );
  }

  const totalHours = Object.values(planData.summaryByDate || {}).reduce(
    (sum, h) => sum + h,
    0
  );

  const currentWeekDates = selectedWeek
    ? tasksByWeek[selectedWeek] || {}
    : {};
  const sortedDates = Object.keys(currentWeekDates).sort();

  return (
    <div className="bg-card border rounded-lg p-4 mt-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="text-xs">
            Auto-Plan Preview
          </Badge>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="text-lg font-bold text-primary">
            {planData.totalTasksPlanned}
          </div>
          <div className="text-xs text-muted-foreground">Tasks</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="text-lg font-bold text-primary">{totalHours}h</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="text-lg font-bold text-primary">
            {planData.weeks.length}
          </div>
          <div className="text-xs text-muted-foreground">Weeks</div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {planData.weeks.map((week) => (
          <button
            key={week.weekStart}
            onClick={() => setSelectedWeek(week.weekStart)}
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium transition-colors',
              selectedWeek === week.weekStart
                ? 'bg-primary text-primary-foreground'
                : hoursPerWeek[week.weekStart] > 0
                  ? 'bg-muted hover:bg-muted/80'
                  : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {week.label}: {hoursPerWeek[week.weekStart]}h
          </button>
        ))}
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        {showDetails ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {showDetails ? 'Hide details' : 'Show task details'}
      </button>

      {showDetails && (
        <div className="max-h-48 overflow-y-auto mb-4 space-y-3">
          {sortedDates.length > 0 ? (
            sortedDates.map((date) => (
              <div key={date} className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(date)}
                  <span className="ml-auto">
                    {currentWeekDates[date].reduce(
                      (sum, t) => sum + t.estimatedTime,
                      0
                    )}
                    h
                  </span>
                </div>
                <div className="space-y-1 pl-4">
                  {currentWeekDates[date].map((task) => (
                    <div
                      key={task.taskId}
                      className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50"
                    >
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          priorityColors[task.priority] || 'bg-gray-500'
                        )}
                      />
                      <span className="truncate flex-1">{task.taskTitle}</span>
                      <span className="text-muted-foreground flex-shrink-0">
                        {task.estimatedTime}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4">
              No tasks for this week
            </div>
          )}
        </div>
      )}

      {/* Unscheduled Tasks Warning */}
      {planData.unscheduledTasks && planData.unscheduledTasks.length > 0 && (
        <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mb-1">
            <AlertTriangle className="h-3 w-3" />
            {planData.unscheduledTasks.length} task(s) could not be scheduled
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
            {planData.unscheduledTasks.slice(0, 3).map((task) => (
              <div key={task.taskId} className="truncate">
                • {task.taskTitle}
              </div>
            ))}
            {planData.unscheduledTasks.length > 3 && (
              <div>...and {planData.unscheduledTasks.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive mb-3">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleApplyPlan}
          disabled={isApplying || planData.plan.length === 0}
          size="sm"
          className="flex-1"
        >
          {isApplying ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Apply Plan ({planData.totalTasksPlanned} tasks)
            </>
          )}
        </Button>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            disabled={isApplying}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
