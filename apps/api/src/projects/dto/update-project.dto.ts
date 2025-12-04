import { IsString, IsArray, IsOptional, MinLength } from 'class-validator';

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
}
