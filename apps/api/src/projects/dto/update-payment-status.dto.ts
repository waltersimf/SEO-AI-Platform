import { IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';

export enum PaymentStatus {
  paid = 'paid',
  pending = 'pending',
  unpaid = 'unpaid',
  overdue = 'overdue',
}

export class UpdatePaymentStatusDto {
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
