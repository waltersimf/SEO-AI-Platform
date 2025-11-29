import { API_URL } from '@/config/api';

// Base URL for tasks API
const TASKS_API = `${API_URL}/api/tasks`;

// Types
export type TaskStatus =
  | 'pending_acceptance'
  | 'backlog'
  | 'scheduled'
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'paused'
  | 'done'
  | 'declined'
  | 'wont_do';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  projectId?: string;
  project?: {
    id: string;
    name: string;
    domain: string;
  };
  organizationId: string;
  scheduledDate?: string;
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  tags: string[];
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  completedAt?: string;
  // Recurring task fields
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  assignedToId?: string;
  projectId?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId?: string;
  assignedToId?: string;
  assignToAll?: boolean;
  includeSelf?: boolean; // For group tasks - whether to include creator
  priority?: TaskPriority;
  dueDate?: string;
  scheduledTime?: string; // Time in HH:MM format
  estimatedTime?: number;
  tags?: string[];
  // Recurring task fields
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  projectId?: string;
  assignedToId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null; // Time in HH:MM format
  estimatedTime?: number;
  actualTime?: number;
  tags?: string[];
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  active: number;
  completed: number;
  pending: number;
}

export interface ScheduleResponse {
  tasks: Task[];
  grouped: Record<string, Task[]>;
  dateFrom: string;
  dateTo: string;
}

// Helper function
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// API Functions

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value);
      }
    });
  }

  const url = `${TASKS_API}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<Task[]>(response);
}

export async function getTaskById(id: string): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<Task>(response);
}

export async function createTask(data: CreateTaskData): Promise<Task> {
  const response = await fetch(TASKS_API, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Task>(response);
}

export async function updateTask(id: string, data: UpdateTaskData): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Task>(response);
}

export async function deleteTask(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${TASKS_API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse(response);
}

export async function getSchedule(dateFrom: string, dateTo: string, userId?: string): Promise<ScheduleResponse> {
  const params = new URLSearchParams({ dateFrom, dateTo });
  if (userId) {
    params.append('userId', userId);
  }

  const response = await fetch(`${TASKS_API}/schedule?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<ScheduleResponse>(response);
}

export async function getBacklog(userId?: string): Promise<Task[]> {
  const params = userId ? `?userId=${userId}` : '';
  const response = await fetch(`${TASKS_API}/backlog${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<Task[]>(response);
}

export async function getTaskStats(userId?: string): Promise<TaskStats> {
  const params = userId ? `?userId=${userId}` : '';
  const response = await fetch(`${TASKS_API}/stats${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<TaskStats>(response);
}

export async function acceptTask(id: string, estimatedTime?: number): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}/accept`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ estimatedTime }),
  });

  return handleResponse<Task>(response);
}

export async function declineTask(id: string, reason: string): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}/decline`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });

  return handleResponse<Task>(response);
}

export async function changeTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  return handleResponse<Task>(response);
}

export async function scheduleTask(id: string, scheduledDate: string): Promise<Task> {
  const response = await fetch(`${TASKS_API}/${id}/schedule`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ scheduledDate }),
  });

  return handleResponse<Task>(response);
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
}

// Comment API Functions
export async function getComments(taskId: string): Promise<Comment[]> {
  const response = await fetch(`${TASKS_API}/${taskId}/comments`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<Comment[]>(response);
}

export async function addComment(taskId: string, data: CreateCommentData): Promise<Comment> {
  const response = await fetch(`${TASKS_API}/${taskId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Comment>(response);
}

export async function deleteComment(taskId: string, commentId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${TASKS_API}/${taskId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse(response);
}
