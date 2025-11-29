import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
  MinLength,
  IsBoolean,
} from 'class-validator';

export enum TaskPriorityDto {
  low = 'low',
  medium = 'medium',
  high = 'high',
  critical = 'critical',
}

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsBoolean()
  @IsOptional()
  assignToAll?: boolean;

  @IsBoolean()
  @IsOptional()
  includeSelf?: boolean; // Default true - whether to include creator in group tasks

  @IsEnum(TaskPriorityDto)
  @IsOptional()
  priority?: TaskPriorityDto = TaskPriorityDto.medium;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  estimatedTime?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // Recurring task fields
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrenceRule?: string; // "daily", "weekly", "monthly"

  @IsDateString()
  @IsOptional()
  recurrenceEnd?: string;
}
