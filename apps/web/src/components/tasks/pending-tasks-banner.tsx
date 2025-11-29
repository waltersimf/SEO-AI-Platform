'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ChevronRight, X } from 'lucide-react';
import { API_URL } from '@/config/api';
import { Task } from '@/lib/api/tasks';

interface PendingTasksBannerProps {
  onReviewTask?: (task: Task) => void;
  onRefresh?: () => void;
}

export function PendingTasksBanner({ onReviewTask, onRefresh }: PendingTasksBannerProps) {
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const fetchPendingTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/tasks/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const tasks = await response.json();
        setPendingTasks(tasks);
      }
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh when onRefresh callback is called
  useEffect(() => {
    if (onRefresh) {
      fetchPendingTasks();
    }
  }, [onRefresh]);

  if (loading || pendingTasks.length === 0 || dismissed) {
    return null;
  }

  const handleReviewClick = () => {
    if (pendingTasks.length > 0 && onReviewTask) {
      onReviewTask(pendingTasks[0]);
    }
  };

  return (
    <div className="mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                Tasks Awaiting Your Approval
              </h4>
              <Badge variant="secondary" className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                {pendingTasks.length}
              </Badge>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {pendingTasks.length === 1
                ? `"${pendingTasks[0].title}" was assigned to you`
                : `${pendingTasks.length} tasks have been assigned to you`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReviewClick}
            className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            Review
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task list preview */}
      {pendingTasks.length > 1 && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
          <div className="flex flex-wrap gap-2">
            {pendingTasks.slice(0, 3).map((task) => (
              <button
                key={task.id}
                onClick={() => onReviewTask?.(task)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-colors"
              >
                {task.title}
              </button>
            ))}
            {pendingTasks.length > 3 && (
              <span className="px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400">
                +{pendingTasks.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
