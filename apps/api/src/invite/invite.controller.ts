import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InviteService } from './invite.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invites')
export class InviteController {
  constructor(private inviteService: InviteService) {}

  /**
   * Create a new invite (OWNER and ADMIN only)
   * POST /api/invites
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async createInvite(@Body() dto: CreateInviteDto, @Req() req) {
    return this.inviteService.createInvite(
      dto,
      req.user.id,
      req.user.organizationId,
    );
  }

  /**
   * List pending invites for organization (OWNER and ADMIN only)
   * GET /api/invites
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async listPendingInvites(@Req() req) {
    return this.inviteService.listPendingInvites(req.user.organizationId);
  }

  /**
   * Revoke an invite (OWNER and ADMIN only)
   * DELETE /api/invites/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async revokeInvite(@Param('id') id: string, @Req() req) {
    return this.inviteService.revokeInvite(id, req.user.organizationId);
  }

  /**
   * Get invite info by token (public, no auth required)
   * GET /api/invites/verify/:token
   */
  @Get('verify/:token')
  async verifyInvite(@Param('token') token: string) {
    return this.inviteService.getInviteByToken(token);
  }

  /**
   * Accept an invite (requires auth)
   * POST /api/invites/accept/:token
   */
  @Post('accept/:token')
  @UseGuards(JwtAuthGuard)
  async acceptInvite(@Param('token') token: string, @Req() req) {
    return this.inviteService.acceptInvite(token, req.user.id);
  }
}
