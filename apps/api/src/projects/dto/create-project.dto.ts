import { IsString, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  domain: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetKeywords?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  competitors?: string[];

  @IsString()
  @IsOptional()
  gscPropertyUrl?: string;

  @IsString()
  @IsOptional()
  gaPropertyId?: string;
}
