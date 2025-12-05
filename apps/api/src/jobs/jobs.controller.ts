import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * DEV ONLY: Test trigger without authentication
   * POST /api/jobs/dev/trigger
   */
  @Post('dev/trigger')
  async devTrigger(@Query('organizationId') organizationId?: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    const result = await this.jobsService.triggerManually(organizationId || undefined);
    return {
      success: true,
      message: 'DEV: Daily SEO fetch triggered',
      ...result,
    };
  }

  /**
   * DEV ONLY: Get queue status without authentication
   * GET /api/jobs/dev/status
   */
  @Get('dev/status')
  async devStatus() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    return this.jobsService.getQueueStatus();
  }

  /**
   * Manually trigger daily SEO fetch
   * POST /api/jobs/trigger-daily-seo
   * Optional query param: ?organizationId=xxx (to run for specific org)
   */
  @Post('trigger-daily-seo')
  @UseGuards(JwtAuthGuard)
  async triggerDailySeo(
    @Req() req: any,
    @Query('organizationId') organizationId?: string,
  ) {
    // Use provided organizationId or fall back to user's organization
    const targetOrgId = organizationId || req.user.organizationId;

    const result = await this.jobsService.triggerManually(targetOrgId);

    return {
      success: true,
      message: 'Daily SEO fetch triggered',
      ...result,
    };
  }

  /**
   * Trigger daily SEO fetch for ALL organizations (admin only)
   * POST /api/jobs/trigger-daily-seo-all
   */
  @Post('trigger-daily-seo-all')
  @UseGuards(JwtAuthGuard)
  async triggerDailySeoAll() {
    const result = await this.jobsService.triggerManually();

    return {
      success: true,
      message: 'Daily SEO fetch triggered for all organizations',
      ...result,
    };
  }

  /**
   * Get job queue status
   * GET /api/jobs/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getQueueStatus() {
    return this.jobsService.getQueueStatus();
  }

  /**
   * Get metrics history for a project
   * GET /api/jobs/history/:projectId
   */
  @Get('history/:projectId')
  @UseGuards(JwtAuthGuard)
  async getMetricsHistory(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    const history = await this.jobsService.getMetricsHistory(
      projectId,
      limit ? parseInt(limit, 10) : 30,
    );

    return {
      projectId,
      count: history.length,
      history,
    };
  }

  /**
   * Get latest metrics for all projects in an organization
   * GET /api/jobs/latest-metrics
   */
  @Get('latest-metrics')
  @UseGuards(JwtAuthGuard)
  async getLatestMetrics(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.jobsService.getLatestMetrics(organizationId);
  }
}
