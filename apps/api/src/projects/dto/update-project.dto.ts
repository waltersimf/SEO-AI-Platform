import { IsString, IsArray, IsOptional, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  domain?: string;

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
