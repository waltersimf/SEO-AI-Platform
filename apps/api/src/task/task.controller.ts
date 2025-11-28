import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  TaskFiltersDto,
  ScheduleQueryDto,
  AcceptTaskDto,
  DeclineTaskDto,
  ChangeStatusDto,
  ScheduleTaskDto,
} from './dto/task-filters.dto';
import { TaskStatus } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateTaskDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      return this.taskService.createTask(dto, userId, organizationId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get()
  async findAll(@Req() req, @Query() filters: TaskFiltersDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      return this.taskService.getTasks({ ...filters, organizationId });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('schedule')
  async getSchedule(@Req() req, @Query() query: ScheduleQueryDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      if (!query.dateFrom || !query.dateTo) {
        throw new BadRequestException('dateFrom and dateTo are required');
      }

      return this.taskService.getSchedule(
        organizationId,
        query.userId,
        query.dateFrom,
        query.dateTo,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schedule';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('backlog')
  async getBacklog(@Req() req, @Query('userId') userId?: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      return this.taskService.getBacklog(organizationId, userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch backlog';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('stats')
  async getStats(@Req() req, @Query('userId') userId?: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      return this.taskService.getTaskStats(organizationId, userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task stats';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      return this.taskService.getTaskById(id, organizationId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Patch(':id')
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      return this.taskService.updateTask(id, organizationId, dto);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      return this.taskService.deleteTask(id, organizationId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post(':id/accept')
  async acceptTask(@Req() req, @Param('id') id: string, @Body() dto: AcceptTaskDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      return this.taskService.acceptTask(id, organizationId, userId, dto.estimatedTime);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to accept task';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post(':id/decline')
  async declineTask(@Req() req, @Param('id') id: string, @Body() dto: DeclineTaskDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const userId = req.user.id;
      const organizationId = req.user.organizationId;

      if (!dto.reason) {
        throw new BadRequestException('Decline reason is required');
      }

      return this.taskService.declineTask(id, organizationId, userId, dto.reason);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to decline task';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Patch(':id/status')
  async changeStatus(@Req() req, @Param('id') id: string, @Body() dto: ChangeStatusDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      if (!dto.status) {
        throw new BadRequestException('Status is required');
      }

      return this.taskService.changeStatus(id, organizationId, dto.status as TaskStatus);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to change task status';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Patch(':id/schedule')
  async scheduleTask(@Req() req, @Param('id') id: string, @Body() dto: ScheduleTaskDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      if (!dto.scheduledDate) {
        throw new BadRequestException('Scheduled date is required');
      }

      return this.taskService.scheduleTask(id, organizationId, dto.scheduledDate);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to schedule task';
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
