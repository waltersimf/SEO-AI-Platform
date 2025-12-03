import { IsEnum } from 'class-validator';

export enum RoleDto {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class UpdateRoleDto {
  @IsEnum(RoleDto)
  role: RoleDto;
}
