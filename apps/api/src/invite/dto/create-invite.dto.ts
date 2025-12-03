import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum RoleDto {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(RoleDto)
  @IsOptional()
  role?: RoleDto = RoleDto.MEMBER;
}
