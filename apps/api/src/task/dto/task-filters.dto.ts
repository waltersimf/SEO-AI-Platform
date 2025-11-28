import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatusDto } from './update-task.dto';

export class TaskFiltersDto {
  @IsEnum(TaskStatusDto)
  @IsOptional()
  status?: TaskStatusDto;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsDateString()
  @IsOptional()
  scheduledDateFrom?: string;

  @IsDateString()
  @IsOptional()
  scheduledDateTo?: string;

  @IsDateString()
  @IsOptional()
  dueDateFrom?: string;

  @IsDateString()
  @IsOptional()
  dueDateTo?: string;
}

export class ScheduleQueryDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsDateString()
  dateFrom: string;

  @IsDateString()
  dateTo: string;
}

export class AcceptTaskDto {
  @IsOptional()
  estimatedTime?: number;
}

export class DeclineTaskDto {
  @IsString()
  reason: string;
}

export class ChangeStatusDto {
  @IsEnum(TaskStatusDto)
  status: TaskStatusDto;
}

export class ScheduleTaskDto {
  @IsDateString()
  scheduledDate: string;
}
