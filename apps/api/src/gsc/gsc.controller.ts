import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { GscService } from './gsc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gsc')
export class GscController {
  constructor(private gscService: GscService) {}

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(
    @Req() req,
    @Query('siteUrl') siteUrl: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const organizationId = req.user.organizationId;

    // Default to last 30 days if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.gscService.getMetrics(organizationId, siteUrl, start, end);
  }
}