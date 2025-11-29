"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrganizationUsers } from "@/hooks/use-organization-users";
import { useProjects } from "@/hooks/use-projects";
import { createTask, updateTask, CreateTaskData, UpdateTaskData, TaskPriority, Task } from "@/lib/api/tasks";
import { Loader2, Repeat } from "lucide-react";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (task?: Task) => void;
  task?: Task; // For edit mode
}

export function TaskForm({ open, onOpenChange, onSuccess, task }: TaskFormProps) {
  const { users, loading: usersLoading } = useOrganizationUsers();
  const { projects, loading: projectsLoading } = useProjects();
  const isEditMode = !!task;

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [projectId, setProjectId] = useState<string>(task?.projectId || "");
  const [assignedToId, setAssignedToId] = useState<string>(task?.assignedToId || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split("T")[0] : "");
  const [scheduledTime, setScheduledTime] = useState((task as any)?.scheduledTime || "");
  const [estimatedTime, setEstimatedTime] = useState(task?.estimatedTime?.toString() || "");
  const [tags, setTags] = useState(task?.tags?.join(", ") || "");
  const [recurrenceRule, setRecurrenceRule] = useState<string>((task as any)?.recurrenceRule || "none");
  const [assignToAll, setAssignToAll] = useState(false);
  const [includeSelf, setIncludeSelf] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recurrenceOptions = [
    { value: "none", label: "Does not repeat" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  // Update form when task prop changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.projectId || "");
      setAssignedToId(task.assignedToId || "");
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setScheduledTime((task as any).scheduledTime || "");
      setEstimatedTime(task.estimatedTime?.toString() || "");
      setTags(task.tags?.join(", ") || "");
      setRecurrenceRule((task as any).recurrenceRule || "none");
    }
  }, [task]);

  const resetForm = () => {
    if (!isEditMode) {
      setTitle("");
      setDescription("");
      setProjectId("");
      setAssignedToId("");
      setPriority("medium");
      setDueDate("");
      setScheduledTime("");
      setEstimatedTime("");
      setTags("");
      setRecurrenceRule("none");
      setAssignToAll(false);
      setIncludeSelf(true);
    }
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    // Assignee is required unless assigning to all
    if (!assignToAll && !assignedToId) {
      setError("Assignee is required");
      return;
    }

    setSubmitting(true);

    try {
      const parsedTags = tags.trim()
        ? tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
        : [];

      if (isEditMode && task) {
        // Update existing task
        const updateData: UpdateTaskData = {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: projectId && projectId !== "none" ? projectId : undefined,
          assignedToId,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          scheduledTime: scheduledTime || undefined,
          estimatedTime: estimatedTime ? parseFloat(estimatedTime) : undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        };

        const updatedTask = await updateTask(task.id, updateData);
        resetForm();
        onOpenChange(false);
        onSuccess?.(updatedTask);
      } else {
        // Create new task
        const data: CreateTaskData = {
          title: title.trim(),
          priority,
        };

        // Handle assignee - either assign to all or to specific person
        if (assignToAll) {
          data.assignToAll = true;
          data.includeSelf = includeSelf;
        } else {
          data.assignedToId = assignedToId;
        }

        if (description.trim()) {
          data.description = description.trim();
        }

        if (projectId && projectId !== "none") {
          data.projectId = projectId;
        }

        if (dueDate) {
          data.dueDate = new Date(dueDate).toISOString();
        }

        if (scheduledTime) {
          data.scheduledTime = scheduledTime;
        }

        if (estimatedTime) {
          const hours = parseFloat(estimatedTime);
          if (!isNaN(hours) && hours > 0) {
            data.estimatedTime = hours;
          }
        }

        if (parsedTags.length > 0) {
          data.tags = parsedTags;
        }

        // Handle recurring task fields
        if (recurrenceRule !== "none") {
          data.isRecurring = true;
          data.recurrenceRule = recurrenceRule;
        }

        const newTask = await createTask(data);
        resetForm();
        onOpenChange(false);
        onSuccess?.(newTask);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditMode ? "Failed to update task" : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Two columns: Project and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={submitting || projectsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <Label htmlFor="assignee">
                Assignee {!assignToAll && <span className="text-destructive">*</span>}
              </Label>
              <Select
                value={assignedToId}
                onValueChange={setAssignedToId}
                disabled={submitting || usersLoading || assignToAll}
              >
                <SelectTrigger>
                  <SelectValue placeholder={assignToAll ? "All team members" : "Select assignee"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.isAI && "(AI)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assign to all team members (only in create mode) */}
          {!isEditMode && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignToAll"
                  checked={assignToAll}
                  onCheckedChange={(checked) => setAssignToAll(checked === true)}
                  disabled={submitting}
                />
                <Label htmlFor="assignToAll" className="text-sm font-normal cursor-pointer">
                  Assign to all team members
                </Label>
              </div>

              {/* Include myself checkbox (shows when assignToAll is checked) */}
              {assignToAll && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="includeSelf"
                    checked={includeSelf}
                    onCheckedChange={(checked) => setIncludeSelf(checked === true)}
                    disabled={submitting}
                  />
                  <Label htmlFor="includeSelf" className="text-sm font-normal cursor-pointer">
                    Include myself
                  </Label>
                </div>
              )}
            </div>
          )}

          {/* Two columns: Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Two columns: Time and Repeat */}
          <div className="grid grid-cols-2 gap-4">
            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Repeat */}
            <div className="space-y-2">
              <Label htmlFor="recurrence">Repeat</Label>
              <Select
                value={recurrenceRule}
                onValueChange={setRecurrenceRule}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        {option.value !== "none" && <Repeat className="h-3 w-3" />}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Two columns: Estimated Time and Tags */}
          <div className="grid grid-cols-2 gap-4">
            {/* Estimated Time */}
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
              <Input
                id="estimatedTime"
                type="number"
                step="0.5"
                min="0"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g., 2.5"
                disabled={submitting}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
                disabled={submitting}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
