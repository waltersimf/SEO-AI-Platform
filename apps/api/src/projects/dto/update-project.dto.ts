import { IsString, IsArray, IsOptional, MinLength, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { PaymentStatus } from './update-payment-status.dto';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  domain?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetKeywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitors?: string[];

  @IsOptional()
  @IsString()
  gscPropertyUrl?: string;

  @IsOptional()
  @IsString()
  gaPropertyId?: string;

  @IsOptional()
  @IsString()
  serpstatProjectId?: string;

  // Payment tracking fields
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  paymentDueDate?: string;

  @IsOptional()
  @IsNumber()
  budgetTotal?: number;

  @IsOptional()
  @IsNumber()
  budgetSpent?: number;

  @IsOptional()
  @IsDateString()
  lastPaymentDate?: string;
}
