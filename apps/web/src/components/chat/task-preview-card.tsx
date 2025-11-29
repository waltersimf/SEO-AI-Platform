'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Calendar, Clock, User, Folder, AlertTriangle, Pencil, X } from 'lucide-react';
import { API_URL } from '@/config/api';
import { cn } from '@/lib/utils';

interface TaskPreviewData {
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  projectId?: string;
  projectName?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime?: number;
  organizationId: string;
}

interface TaskPreviewCardProps {
  taskData: TaskPreviewData;
  onTaskCreated?: (taskId: string) => void;
  onEdit?: (taskData: TaskPreviewData) => void;
  onDismiss?: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300',
};

export function TaskPreviewCard({
  taskData,
  onTaskCreated,
  onEdit,
  onDismiss,
}: TaskPreviewCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          assignedToId: taskData.assigneeId,
          projectId: taskData.projectId,
          dueDate: taskData.dueDate,
          priority: taskData.priority || 'medium',
          estimatedTime: taskData.estimatedTime,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const createdTask = await response.json();
      setCreatedTaskId(createdTask.id);
      setIsCreated(true);
      onTaskCreated?.(createdTask.id);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isCreated && createdTaskId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Task created successfully!</span>
        </div>
        <a
          href={`/dashboard/tasks/${createdTaskId}`}
          className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 hover:text-green-700 underline"
        >
          View Task
        </a>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 mt-2 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Task Preview
          </Badge>
          {taskData.priority && (
            <Badge className={cn('text-xs', priorityColors[taskData.priority])}>
              {taskData.priority}
            </Badge>
          )}
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

      {/* Title */}
      <h4 className="font-semibold text-foreground mb-2">{taskData.title}</h4>

      {/* Description */}
      {taskData.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {taskData.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
        {taskData.assigneeName && (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>{taskData.assigneeName}</span>
          </div>
        )}
        {taskData.projectName && (
          <div className="flex items-center gap-1">
            <Folder className="h-3.5 w-3.5" />
            <span>{taskData.projectName}</span>
          </div>
        )}
        {taskData.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(taskData.dueDate)}</span>
          </div>
        )}
        {taskData.estimatedTime && (
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{taskData.estimatedTime}h</span>
          </div>
        )}
      </div>

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
          onClick={handleCreateTask}
          disabled={isCreating}
          size="sm"
          className="flex-1"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Create Task
            </>
          )}
        </Button>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(taskData)}
            disabled={isCreating}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            disabled={isCreating}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
