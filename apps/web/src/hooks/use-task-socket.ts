'use client';

import { useEffect, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { Task } from '@/lib/api/tasks';

interface UseTaskSocketOptions {
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (data: { taskId: string }) => void;
  onTaskStatusChanged?: (task: Task) => void;
}

export function useTaskSocket(options: UseTaskSocketOptions = {}) {
  const { onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskStatusChanged } = options;

  const joinOrganization = useCallback((organizationId: string, userId: string) => {
    const socket = getSocket();
    if (socket && socket.emit) {
      socket.emit('join_organization', { organizationId, userId });
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !socket.on) {
      return;
    }

    // Listen for task events
    if (onTaskCreated) {
      socket.on('task_created', onTaskCreated);
    }

    if (onTaskUpdated) {
      socket.on('task_updated', onTaskUpdated);
    }

    if (onTaskDeleted) {
      socket.on('task_deleted', onTaskDeleted);
    }

    if (onTaskStatusChanged) {
      socket.on('task_status_changed', onTaskStatusChanged);
    }

    // Cleanup
    return () => {
      if (onTaskCreated) {
        socket.off('task_created', onTaskCreated);
      }
      if (onTaskUpdated) {
        socket.off('task_updated', onTaskUpdated);
      }
      if (onTaskDeleted) {
        socket.off('task_deleted', onTaskDeleted);
      }
      if (onTaskStatusChanged) {
        socket.off('task_status_changed', onTaskStatusChanged);
      }
    };
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskStatusChanged]);

  return { joinOrganization };
}
