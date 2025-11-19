import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('organization')
  async getOrganizationUsers(@Req() req) {
    const organizationId = req.user.organizationId;
    return this.usersService.getOrganizationUsers(organizationId);
  }
}
