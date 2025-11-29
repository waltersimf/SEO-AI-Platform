'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
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
  onDismiss?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  isAI?: boolean;
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

export function TaskPreviewCard({
  taskData,
  onTaskCreated,
  onDismiss,
}: TaskPreviewCardProps) {
  // Editable state
  const [title, setTitle] = useState(taskData.title);
  const [description, setDescription] = useState(taskData.description || '');
  const [assigneeId, setAssigneeId] = useState(taskData.assigneeId || 'unassigned');
  const [assignToAll, setAssignToAll] = useState(false);
  const [dueDate, setDueDate] = useState(taskData.dueDate || '');
  const [priority, setPriority] = useState<string>(taskData.priority || 'medium');
  const [estimatedTime, setEstimatedTime] = useState<string>(
    taskData.estimatedTime?.toString() || ''
  );

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [createdTaskCount, setCreatedTaskCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(!!taskData.description);

  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/users/organization`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const members = await response.json();
          setTeamMembers(members.filter((m: TeamMember) => !m.isAI));
        }
      } catch (err) {
        console.error('Failed to fetch team members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

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
          title: title.trim(),
          description: description.trim() || undefined,
          // If assignToAll is checked, don't send assignedToId
          ...(assignToAll
            ? { assignToAll: true }
            : { assignedToId: assigneeId && assigneeId !== 'unassigned' ? assigneeId : undefined }
          ),
          projectId: taskData.projectId || undefined,
          dueDate: dueDate || undefined,
          priority: priority,
          estimatedTime: estimatedTime ? parseFloat(estimatedTime) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const result = await response.json();

      // Handle group task response (multiple tasks created)
      if (assignToAll && result.tasks) {
        setCreatedTaskCount(result.count);
        setCreatedTaskId(result.groupTaskId);
      } else {
        setCreatedTaskId(result.id);
        setCreatedTaskCount(1);
      }

      setIsCreated(true);
      onTaskCreated?.(assignToAll ? result.groupTaskId : result.id);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  if (isCreated && createdTaskId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">
            {createdTaskCount > 1
              ? `${createdTaskCount} tasks created for all team members!`
              : 'Task created successfully!'}
          </span>
        </div>
        {createdTaskCount === 1 && (
          <a
            href={`/dashboard/tasks/${createdTaskId}`}
            className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 hover:text-green-700 underline"
          >
            View Task
          </a>
        )}
        {createdTaskCount > 1 && (
          <a
            href="/dashboard/tasks"
            className="inline-flex items-center gap-1 mt-2 text-sm text-green-600 hover:text-green-700 underline"
          >
            View Tasks
          </a>
        )}
      </div>
    );
  }

  const selectedPriority = priorityOptions.find((p) => p.value === priority);

  return (
    <div className="bg-card border rounded-lg p-4 mt-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Task Preview
          </Badge>
          {selectedPriority && (
            <Badge className={cn('text-xs', selectedPriority.color)}>
              {selectedPriority.label}
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

      {/* Title Input */}
      <div className="mb-4">
        <Label htmlFor="task-title" className="text-xs text-muted-foreground mb-1 block">
          Title
        </Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="font-medium"
        />
      </div>

      {/* Assign to all checkbox */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
        <Checkbox
          id="assign-to-all"
          checked={assignToAll}
          onCheckedChange={(checked) => setAssignToAll(checked === true)}
        />
        <Label
          htmlFor="assign-to-all"
          className="flex items-center gap-2 text-sm cursor-pointer"
        >
          <Users className="h-4 w-4" />
          Assign to all team members
          {teamMembers.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({teamMembers.length} members)
            </span>
          )}
        </Label>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Assignee */}
        <div className={cn(assignToAll && 'opacity-50 pointer-events-none')}>
          <Label htmlFor="task-assignee" className="text-xs text-muted-foreground mb-1 block">
            Assignee
          </Label>
          <Select value={assigneeId} onValueChange={setAssigneeId} disabled={assignToAll}>
            <SelectTrigger id="task-assignee" className="h-9">
              <SelectValue placeholder={loadingMembers ? 'Loading...' : 'Unassigned'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers
                .filter((member) => member.id)
                .map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div>
          <Label htmlFor="task-duedate" className="text-xs text-muted-foreground mb-1 block">
            Due Date
          </Label>
          <Input
            id="task-duedate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Estimated Time */}
        <div>
          <Label htmlFor="task-estimate" className="text-xs text-muted-foreground mb-1 block">
            Est. Time (hours)
          </Label>
          <Input
            id="task-estimate"
            type="number"
            min="0"
            step="0.5"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="0"
            className="h-9"
          />
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="task-priority" className="text-xs text-muted-foreground mb-1 block">
            Priority
          </Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="task-priority" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        option.value === 'low' && 'bg-green-500',
                        option.value === 'medium' && 'bg-yellow-500',
                        option.value === 'high' && 'bg-orange-500',
                        option.value === 'critical' && 'bg-red-500'
                      )}
                    />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Description */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowDescription(!showDescription)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDescription ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          Description (optional)
        </button>
        {showDescription && (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add task description..."
            className="mt-2 w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
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
          disabled={isCreating || !title.trim()}
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
