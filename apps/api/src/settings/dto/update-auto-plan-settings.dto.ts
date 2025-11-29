import { IsBoolean, IsInt, IsOptional, IsString, Min, Max, Matches } from 'class-validator';

export class UpdateAutoPlanSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  frequency?: 'daily' | 'weekly';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number; // 0=Sunday, 1=Monday, etc.

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  time?: string;

  @IsOptional()
  @IsBoolean()
  notifyBeforeApply?: boolean;

  @IsOptional()
  @IsBoolean()
  autoApply?: boolean;
}
