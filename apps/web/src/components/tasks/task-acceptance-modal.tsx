'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Folder,
  Loader2,
  User,
  XCircle,
} from 'lucide-react';
import { API_URL } from '@/config/api';
import { Task } from '@/lib/api/tasks';
import { cn } from '@/lib/utils';

interface TaskAcceptanceModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAccepted?: (task: Task) => void;
  onTaskDeclined?: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function TaskAcceptanceModal({
  task,
  open,
  onOpenChange,
  onTaskAccepted,
  onTaskDeclined,
}: TaskAcceptanceModalProps) {
  const [mode, setMode] = useState<'review' | 'decline'>('review');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with new task
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && task) {
      setMode('review');
      setEstimatedTime(task.estimatedTime?.toString() || '');
      setDeclineReason('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const handleAccept = async () => {
    if (!task) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${task.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          estimatedTime: estimatedTime ? parseFloat(estimatedTime) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept task');
      }

      const updatedTask = await response.json();
      onTaskAccepted?.(updatedTask);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!task) return;

    if (!declineReason.trim()) {
      setError('Please provide a reason for declining');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/${task.id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: declineReason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to decline task');
      }

      const updatedTask = await response.json();
      onTaskDeclined?.(updatedTask);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Task Assignment Review
          </SheetTitle>
          <SheetDescription>
            This task has been assigned to you. Review the details and accept or decline.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{task.title}</h3>
              {task.description && (
                <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Created By */}
              {task.createdBy && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">{task.createdBy.name}</span>
                </div>
              )}

              {/* Project */}
              {task.project && (
                <div className="flex items-center gap-2 text-sm">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{task.project.name}</span>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Priority */}
              <div className="flex items-center gap-2">
                <Badge className={cn('text-xs', priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              </div>

              {/* Estimated Time */}
              {task.estimatedTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Est:</span>
                  <span className="font-medium">{task.estimatedTime}h</span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'review' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('review')}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              variant={mode === 'decline' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setMode('decline')}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>

          {/* Accept Mode */}
          {mode === 'review' && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Ready to accept this task?</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-time">
                  Your time estimate (optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="estimated-time"
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder={task.estimatedTime?.toString() || '0'}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Update the estimated time if you think it will take longer or shorter
                </p>
              </div>
            </div>
          )}

          {/* Decline Mode */}
          {mode === 'decline' && (
            <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Why are you declining?</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decline-reason">Reason (required)</Label>
                <Textarea
                  id="decline-reason"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g., I'm overloaded this week, or this task requires skills I don't have..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This will be shared with the task creator so they can reassign
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {mode === 'review' ? (
            <Button onClick={handleAccept} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Task
                </>
              )}
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleDecline} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline Task
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
