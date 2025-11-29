"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskForm } from "@/components/tasks/task-form";
import { Task, getTaskById, deleteTask } from "@/lib/api/tasks";

interface TaskDetailModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUserName: string;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function TaskDetailModal({
  taskId,
  open,
  onOpenChange,
  currentUserId,
  currentUserName,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      loadTask();
    } else if (!open) {
      // Reset state when closing
      setTask(null);
      setError(null);
    }
  }, [taskId, open]);

  const loadTask = async () => {
    if (!taskId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getTaskById(taskId);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (updatedTask: Task) => {
    setTask(updatedTask);
    onTaskUpdated?.(updatedTask);
  };

  const handleEditSuccess = (updatedTask?: Task) => {
    if (updatedTask) {
      setTask(updatedTask);
      onTaskUpdated?.(updatedTask);
    }
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!taskId) return;

    setDeleting(true);
    try {
      await deleteTask(taskId);
      onTaskDeleted?.(taskId);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[600px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={loadTask}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && task && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between pr-8">
                  <SheetTitle className="text-lg">Task Details</SheetTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* Task Detail */}
              <div className="bg-card rounded-lg border p-4 mb-4">
                <TaskDetail
                  task={task}
                  currentUserId={currentUserId}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* Comments Section */}
              <div className="bg-card rounded-lg border p-4">
                <TaskComments
                  taskId={task.id}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Modal */}
      {task && (
        <TaskForm
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          task={task}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{task?.title}&quot;? This action cannot
              be undone. All comments and time entries associated with this task
              will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Task"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
