import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFiltersDto } from './dto/task-filters.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

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
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
        createdById: userId,
        organizationId,
        priority: dto.priority as any,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        estimatedTime: dto.estimatedTime,
        tags: dto.tags || [],
      },
      include: this.taskInclude,
    });

    return task;
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
    await this.getTaskById(id, organizationId);

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
    if (dto.status === 'done') {
      updateData.completedAt = new Date();
    } else if (dto.status && dto.status !== 'done') {
      updateData.completedAt = null;
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: this.taskInclude,
    });

    return task;
  }

  async deleteTask(id: string, organizationId: string) {
    await this.getTaskById(id, organizationId);

    await this.prisma.task.delete({
      where: { id },
    });

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

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        acceptedAt: new Date(),
        declinedAt: null,
        declineReason: null,
        status: TaskStatus.todo,
        ...(estimatedTime !== undefined && { estimatedTime }),
      },
      include: this.taskInclude,
    });

    return updatedTask;
  }

  async declineTask(id: string, organizationId: string, userId: string, reason: string) {
    const task = await this.getTaskById(id, organizationId);

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('Only the assigned user can decline this task');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        declinedAt: new Date(),
        declineReason: reason,
        acceptedAt: null,
      },
      include: this.taskInclude,
    });

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

  async getTaskStats(organizationId: string, userId?: string) {
    const where: any = { organizationId };

    if (userId) {
      where.assignedToId = userId;
    }

    const [
      total,
      backlog,
      scheduled,
      todo,
      inProgress,
      blocked,
      paused,
      done,
      wontDo,
    ] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.backlog } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.scheduled } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.todo } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.in_progress } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.blocked } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.paused } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.done } }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.wont_do } }),
    ]);

    return {
      total,
      byStatus: {
        backlog,
        scheduled,
        todo,
        in_progress: inProgress,
        blocked,
        paused,
        done,
        wont_do: wontDo,
      },
      active: todo + inProgress + scheduled,
      completed: done,
      pending: backlog + blocked + paused,
    };
  }
}
