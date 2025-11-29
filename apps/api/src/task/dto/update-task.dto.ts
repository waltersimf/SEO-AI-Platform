import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
  MinLength,
} from 'class-validator';
import { TaskPriorityDto } from './create-task.dto';

export enum TaskStatusDto {
  backlog = 'backlog',
  scheduled = 'scheduled',
  todo = 'todo',
  in_progress = 'in_progress',
  blocked = 'blocked',
  paused = 'paused',
  done = 'done',
  wont_do = 'wont_do',
}

export class UpdateTaskDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsEnum(TaskPriorityDto)
  @IsOptional()
  priority?: TaskPriorityDto;

  @IsEnum(TaskStatusDto)
  @IsOptional()
  status?: TaskStatusDto;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  scheduledTime?: string; // Time in HH:MM format (e.g., "11:00", "14:30")

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @IsNumber()
  @IsOptional()
  actualTime?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
