import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeamService } from './team.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  /**
   * Get all team members for the organization
   * GET /api/team
   */
  @Get()
  async getTeamMembers(@Req() req) {
    return this.teamService.getTeamMembers(req.user.organizationId);
  }

  /**
   * Update a member's role (OWNER and ADMIN only)
   * PATCH /api/team/:userId/role
   */
  @Patch(':userId/role')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async updateMemberRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleDto,
    @Req() req,
  ) {
    return this.teamService.updateMemberRole(
      userId,
      dto.role as Role,
      req.user.id,
      req.user.organizationId,
    );
  }

  /**
   * Remove a member from the organization (soft delete)
   * DELETE /api/team/:userId
   */
  @Delete(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async removeMember(@Param('userId') userId: string, @Req() req) {
    return this.teamService.removeMember(
      userId,
      req.user.id,
      req.user.organizationId,
    );
  }
}
