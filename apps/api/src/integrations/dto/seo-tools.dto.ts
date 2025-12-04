import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConnectAhrefsDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

export class ConnectSerpstatDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}

export class UpdateSerpstatSettingsDto {
  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  accountId?: string;
}
