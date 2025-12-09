import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get organizationId from user - either from JWT or by looking up membership
   */
  private async getOrganizationId(user: { id?: string; sub?: string; organizationId?: string }): Promise<string> {
    // Try from JWT first
    if (user.organizationId) {
      return user.organizationId;
    }

    // Fallback: lookup from OrganizationMember
    const userId = user.sub || user.id;
    if (!userId) {
      throw new BadRequestException('User ID not found in token');
    }

    const membership = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of any organization');
    }

    return membership.organizationId;
  }

  /**
   * Get insights for all projects in organization
   */
  @Get('insights')
  async getInsights(@Req() req) {
    try {
      if (!req.user) {
        throw new BadRequestException('User not authenticated');
      }

      const organizationId = await this.getOrganizationId(req.user);
      this.logger.debug(`Fetching insights for organization: ${organizationId}`);

      return this.analyticsService.getOrganizationInsights(organizationId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Error fetching insights:', error);
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
      if (!req.user) {
        throw new BadRequestException('User not authenticated');
      }

      // Verify user has access to this project's organization
      const organizationId = await this.getOrganizationId(req.user);

      // Verify project belongs to user's organization
      const project = await this.prisma.project.findFirst({
        where: {
          id,
          organizationId,
          isDeleted: false,
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found or access denied');
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

      this.logger.error('Error fetching project analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project analysis';
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
