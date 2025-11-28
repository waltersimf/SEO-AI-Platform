import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class ManualTimeEntryDto {
  @IsNumber()
  @Min(0)
  duration: number; // Duration in minutes

  @IsString()
  @IsOptional()
  note?: string;
}
