import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFiltersDto } from './dto/task-filters.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  private readonly taskInclude = {
    assignedTo: {
      select: { id: true, name: true, email: true, avatar: true },
    },
    createdBy: {
      select: { id: true, name: true, email: true, avatar: true },
    },
    project: {
      select: { id: true, name: true, domain: true },
    },
  };

  async createTask(dto: CreateTaskDto, userId: string, organizationId: string) {
    // Determine initial status:
    // - If assigned to someone else → pending_acceptance
    // - If self-assigned or unassigned → backlog
    const isAssignedToOther = dto.assignedToId && dto.assignedToId !== userId;
    const initialStatus = isAssignedToOther
      ? TaskStatus.pending_acceptance
      : TaskStatus.backlog;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
        createdById: userId,
        organizationId,
        status: initialStatus,
        priority: dto.priority as any,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        estimatedTime: dto.estimatedTime,
        tags: dto.tags || [],
        // Recurring task fields
        isRecurring: dto.isRecurring || false,
        recurrenceRule: dto.recurrenceRule,
        recurrenceEnd: dto.recurrenceEnd ? new Date(dto.recurrenceEnd) : null,
      },
      include: this.taskInclude,
    });

    // Emit real-time event
    this.eventsGateway.emitTaskCreated(organizationId, task);

    return task;
  }

  async createGroupTask(dto: CreateTaskDto, userId: string, organizationId: string) {
    // Fetch all organization members (excluding AI users)
    let members = await this.prisma.user.findMany({
      where: {
        organizationId,
        isAI: false,
      },
      select: { id: true, name: true },
    });

    // Filter out creator if includeSelf is false
    const includeSelf = dto.includeSelf !== false; // Default to true
    if (!includeSelf) {
      members = members.filter((m) => m.id !== userId);
    }

    if (members.length === 0) {
      throw new NotFoundException('No team members found in organization');
    }

    // Generate a unique groupTaskId
    const groupTaskId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a task for each member
    const createdTasks = [];

    for (const member of members) {
      // For group tasks, all members get pending_acceptance status
      // so everyone confirms their participation (including creator if included)
      const initialStatus = TaskStatus.pending_acceptance;

      const task = await this.prisma.task.create({
        data: {
          title: dto.title,
          description: dto.description,
          projectId: dto.projectId,
          assignedToId: member.id,
          createdById: userId,
          organizationId,
          status: initialStatus,
          priority: dto.priority as any,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          estimatedTime: dto.estimatedTime,
          tags: dto.tags || [],
          groupTaskId,
          isGroupTask: true,
        },
        include: this.taskInclude,
      });

      createdTasks.push(task);

      // Emit real-time event for each task
      this.eventsGateway.emitTaskCreated(organizationId, task);
    }

    return {
      groupTaskId,
      tasks: createdTasks,
      count: createdTasks.length,
    };
  }

  async getTasks(filters: TaskFiltersDto & { organizationId: string }) {
    const where: any = {
      organizationId: filters.organizationId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.scheduledDateFrom || filters.scheduledDateTo) {
      where.scheduledDate = {};
      if (filters.scheduledDateFrom) {
        where.scheduledDate.gte = new Date(filters.scheduledDateFrom);
      }
      if (filters.scheduledDateTo) {
        where.scheduledDate.lte = new Date(filters.scheduledDateTo);
      }
    }

    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = new Date(filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = new Date(filters.dueDateTo);
      }
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: this.taskInclude,
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks;
  }

  async getTaskById(id: string, organizationId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ...this.taskInclude,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        timeEntries: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.organizationId !== organizationId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async updateTask(id: string, organizationId: string, dto: UpdateTaskDto) {
    const existingTask = await this.getTaskById(id, organizationId);

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.assignedToId !== undefined) updateData.assignedToId = dto.assignedToId;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.scheduledDate !== undefined) updateData.scheduledDate = dto.scheduledDate ? new Date(dto.scheduledDate) : null;
    if (dto.estimatedTime !== undefined) updateData.estimatedTime = dto.estimatedTime;
    if (dto.actualTime !== undefined) updateData.actualTime = dto.actualTime;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    // Auto-set completedAt when status changes to done
    if ((dto.status as string) === 'done') {
      updateData.completedAt = new Date();
    } else if (dto.status && (dto.status as string) !== 'done') {
      updateData.completedAt = null;
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: this.taskInclude,
    });

    // Emit real-time event
    this.eventsGateway.emitTaskUpdated(organizationId, task);

    // Auto-create next occurrence for recurring tasks when marked as done
    if ((dto.status as string) === 'done' && existingTask.isRecurring && existingTask.recurrenceRule) {
      await this.createNextRecurringTask(existingTask, organizationId);
    }

    return task;
  }

  /**
   * Calculate next scheduled date based on recurrence rule
   */
  private calculateNextDate(baseDate: Date | null, rule: string): Date {
    const date = baseDate ? new Date(baseDate) : new Date();

    switch (rule) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        date.setDate(date.getDate() + 1); // Default to daily
    }

    return date;
  }

  /**
   * Create the next occurrence of a recurring task
   */
  private async createNextRecurringTask(parentTask: any, organizationId: string) {
    // Check if recurrence has ended
    if (parentTask.recurrenceEnd && new Date() > new Date(parentTask.recurrenceEnd)) {
      console.log(`Recurring task ${parentTask.id} has reached its end date, not creating next occurrence`);
      return null;
    }

    // Calculate next scheduled date
    const nextScheduledDate = this.calculateNextDate(
      parentTask.scheduledDate,
      parentTask.recurrenceRule,
    );

    // Check if next date is past recurrence end
    if (parentTask.recurrenceEnd && nextScheduledDate > new Date(parentTask.recurrenceEnd)) {
      console.log(`Next occurrence date is past recurrence end, not creating`);
      return null;
    }

    // Determine initial status (same logic as createTask)
    const isAssignedToOther = parentTask.assignedToId && parentTask.assignedToId !== parentTask.createdById;
    const initialStatus = isAssignedToOther
      ? TaskStatus.pending_acceptance
      : TaskStatus.backlog;

    // Create the next occurrence
    const nextTask = await this.prisma.task.create({
      data: {
        title: parentTask.title,
        description: parentTask.description,
        projectId: parentTask.projectId,
        assignedToId: parentTask.assignedToId,
        createdById: parentTask.createdById,
        organizationId,
        status: initialStatus,
        priority: parentTask.priority,
        scheduledDate: nextScheduledDate,
        dueDate: parentTask.dueDate ? this.calculateNextDate(parentTask.dueDate, parentTask.recurrenceRule) : null,
        estimatedTime: parentTask.estimatedTime,
        tags: parentTask.tags || [],
        // Recurring task fields - carry forward
        isRecurring: true,
        recurrenceRule: parentTask.recurrenceRule,
        recurrenceEnd: parentTask.recurrenceEnd,
        // Link to original parent (first task in series)
        parentTaskId: parentTask.parentTaskId || parentTask.id,
      },
      include: this.taskInclude,
    });

    console.log(`Created next recurring task ${nextTask.id} for parent ${parentTask.id}`);

    // Emit real-time event for the new task
    this.eventsGateway.emitTaskCreated(organizationId, nextTask);

    return nextTask;
  }

  async deleteTask(id: string, organizationId: string) {
    // Validate task exists before deleting
    await this.getTaskById(id, organizationId);

    await this.prisma.task.delete({
      where: { id },
    });

    // Emit real-time event
    this.eventsGateway.emitTaskDeleted(organizationId, id);

    return {
      success: true,
      message: 'Task deleted successfully',
      taskId: id,
    };
  }

  async acceptTask(id: string, organizationId: string, userId: string, estimatedTime?: number) {
    const task = await this.getTaskById(id, organizationId);

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('Only the assigned user can accept this task');
    }

    if (task.status !== TaskStatus.pending_acceptance) {
      throw new ForbiddenException('This task is not pending acceptance');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        acceptedAt: new Date(),
        declinedAt: null,
        declineReason: null,
        status: TaskStatus.backlog,
        ...(estimatedTime !== undefined && { estimatedTime }),
      },
      include: this.taskInclude,
    });

    // Emit real-time event for status change
    this.eventsGateway.emitTaskStatusChanged(organizationId, updatedTask);

    return updatedTask;
  }

  async declineTask(id: string, organizationId: string, userId: string, reason: string) {
    const task = await this.getTaskById(id, organizationId);

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('Only the assigned user can decline this task');
    }

    if (task.status !== TaskStatus.pending_acceptance) {
      throw new ForbiddenException('This task is not pending acceptance');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        declinedAt: new Date(),
        declineReason: reason,
        acceptedAt: null,
        status: TaskStatus.declined,
        assignedToId: null, // Unassign when declined
      },
      include: this.taskInclude,
    });

    // Emit real-time event for status change
    this.eventsGateway.emitTaskStatusChanged(organizationId, updatedTask);

    return updatedTask;
  }

  async changeStatus(id: string, organizationId: string, status: TaskStatus) {
    await this.getTaskById(id, organizationId);

    const updateData: any = { status };

    if (status === TaskStatus.done) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: this.taskInclude,
    });

    // Emit real-time event for status change
    this.eventsGateway.emitTaskStatusChanged(organizationId, task);

    return task;
  }

  async scheduleTask(id: string, organizationId: string, scheduledDate: string) {
    await this.getTaskById(id, organizationId);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        scheduledDate: new Date(scheduledDate),
        status: TaskStatus.scheduled,
      },
      include: this.taskInclude,
    });

    // Emit real-time event for schedule update
    this.eventsGateway.emitTaskUpdated(organizationId, task);

    return task;
  }

  async getSchedule(
    organizationId: string,
    userId: string | undefined,
    dateFrom: string,
    dateTo: string,
  ) {
    const where: any = {
      organizationId,
      scheduledDate: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      },
    };

    if (userId) {
      where.assignedToId = userId;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: this.taskInclude,
      orderBy: [{ scheduledDate: 'asc' }, { priority: 'desc' }],
    });

    // Group tasks by date
    const grouped: Record<string, typeof tasks> = {};

    for (const task of tasks) {
      if (task.scheduledDate) {
        const dateKey = task.scheduledDate.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    }

    return {
      tasks,
      grouped,
      dateFrom,
      dateTo,
    };
  }

  async getBacklog(organizationId: string, userId?: string) {
    const where: any = {
      organizationId,
      scheduledDate: null,
      status: {
        in: [TaskStatus.backlog, TaskStatus.todo],
      },
    };

    if (userId) {
      where.assignedToId = userId;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: this.taskInclude,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return tasks;
  }

  async getPendingTasks(organizationId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        organizationId,
        assignedToId: userId,
        status: TaskStatus.pending_acceptance,
      },
      include: this.taskInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return tasks;
  }

  async getTaskStats(organizationId: string, userId?: string) {
    const where: any = { organizationId };

    if (userId) {
      where.assignedToId = userId;
    }

    const [
      total,
      pendingAcceptance,
      backlog,
      scheduled,
      todo,
      inProgress,
      blocked,
      paused,
      done,
      declined,
      wontDo,
    ] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.pending_acceptance } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.backlog } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.scheduled } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.todo } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.in_progress } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.blocked } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.paused } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.done } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.declined } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.wont_do } }),
    ]);

    return {
      total,
      byStatus: {
        pending_acceptance: pendingAcceptance,
        backlog,
        scheduled,
        todo,
        in_progress: inProgress,
        blocked,
        paused,
        done,
        declined,
        wont_do: wontDo,
      },
      active: todo + inProgress + scheduled,
      completed: done,
      pending: backlog + blocked + paused,
      awaitingAction: pendingAcceptance,
    };
  }

  // ==================== COMMENTS ====================

  async addComment(taskId: string, organizationId: string, userId: string, content: string) {
    // Verify task exists and user has access
    await this.getTaskById(taskId, organizationId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return comment;
  }

  async getComments(taskId: string, organizationId: string) {
    // Verify task exists and user has access
    await this.getTaskById(taskId, organizationId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      message: 'Comment deleted successfully',
      commentId,
    };
  }

  // ==================== TIME ENTRIES ====================

  private async updateTaskActualTime(taskId: string) {
    // Sum all completed time entries for this task
    const result = await this.prisma.timeEntry.aggregate({
      where: {
        taskId,
        endedAt: { not: null },
      },
      _sum: {
        duration: true,
      },
    });

    const totalMinutes = result._sum.duration || 0;
    const totalHours = totalMinutes / 60;

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualTime: totalHours },
    });
  }

  async startTimer(taskId: string, organizationId: string, userId: string) {
    // Verify task exists and user has access
    await this.getTaskById(taskId, organizationId);

    // Check if user already has an active timer
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endedAt: null,
      },
    });

    if (activeTimer) {
      throw new ForbiddenException(
        'You already have an active timer. Stop it before starting a new one.',
      );
    }

    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        startedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return timeEntry;
  }

  async stopTimer(taskId: string, organizationId: string, userId: string) {
    // Verify task exists and user has access
    await this.getTaskById(taskId, organizationId);

    // Find active timer for this task and user
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: {
        taskId,
        userId,
        endedAt: null,
      },
    });

    if (!activeTimer) {
      throw new NotFoundException('No active timer found for this task');
    }

    const endedAt = new Date();
    const startedAt = new Date(activeTimer.startedAt);
    // Calculate duration in minutes
    const durationMs = endedAt.getTime() - startedAt.getTime();
    const durationMinutes = durationMs / 60000;

    const timeEntry = await this.prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endedAt,
        duration: durationMinutes,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    // Update task's actual time
    await this.updateTaskActualTime(taskId);

    return timeEntry;
  }

  async getTimeEntries(taskId: string, organizationId: string) {
    // Verify task exists and user has access
    await this.getTaskById(taskId, organizationId);

    const timeEntries = await this.prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return timeEntries;
  }

  async getActiveTimer(userId: string) {
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    return activeTimer;
  }

  async addManualTimeEntry(
    taskId: string,
    organizationId: string,
    userId: string,
    duration: number,
    note?: string,
  ) {
    // Verify task exists and user has access
    await this.getTaskById(taskId, organizationId);

    const now = new Date();
    // For manual entries, set startedAt to now - duration, endedAt to now
    const startedAt = new Date(now.getTime() - duration * 60000);

    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        startedAt,
        endedAt: now,
        duration,
        note,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    // Update task's actual time
    await this.updateTaskActualTime(taskId);

    return timeEntry;
  }
}
