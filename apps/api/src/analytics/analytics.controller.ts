import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get insights for all projects in organization
   */
  @Get('insights')
  async getInsights(@Req() req) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.analyticsService.getOrganizationInsights(organizationId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insights';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * Get detailed analysis for a specific project
   */
  @Get('project/:id')
  async getProjectAnalysis(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const analysis = await this.analyticsService.getDetailedAnalysis(id);

      if (!analysis.project) {
        throw new NotFoundException('Project not found');
      }

      return analysis;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project analysis';
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
