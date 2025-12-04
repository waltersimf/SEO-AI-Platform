import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AhrefsService } from '../integrations/ahrefs.service';
import { SerpstatService } from '../integrations/serpstat.service';
import { GscService } from '../gsc/gsc.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private projectsService: ProjectsService,
    private ahrefsService: AhrefsService,
    private serpstatService: SerpstatService,
    private gscService: GscService,
    private integrationsService: IntegrationsService,
  ) {}

  @Get()
  async findAll(@Req() req) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.findAll(organizationId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async create(@Req() req, @Body() dto: CreateProjectDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.create(organizationId, dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.findOne(id, organizationId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async update(@Req() req, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.update(id, organizationId, dto);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  async delete(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;
      return this.projectsService.softDelete(id, organizationId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * Get SEO metrics for a project from all connected integrations
   */
  @Get(':id/seo-metrics')
  async getSeoMetrics(@Req() req, @Param('id') id: string) {
    try {
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      const organizationId = req.user.organizationId;

      // Get the project
      const project = await this.projectsService.findOne(id, organizationId);
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const domain = project.domain;
      const gscPropertyUrl = project.gscPropertyUrl;
      const gaPropertyId = project.gaPropertyId;
      const serpstatProjectId = project.serpstatProjectId;

      // Check which integrations are connected
      const [googleIntegration, ahrefsIntegration, serpstatIntegration] = await Promise.all([
        this.integrationsService.findOne(organizationId, 'google'),
        this.integrationsService.findOne(organizationId, 'ahrefs'),
        this.integrationsService.findOne(organizationId, 'serpstat'),
      ]);

      // Prepare result object
      const result: {
        gsc: {
          connected: boolean;
          propertyUrl: string | null;
          data?: {
            performance: any;
            topQueries: any[];
          };
          error?: string;
        };
        ga4: {
          connected: boolean;
          propertyId: string | null;
          data?: {
            overview: any;
          };
          error?: string;
        };
        ahrefs: {
          connected: boolean;
          data?: {
            metrics: any;
            topKeywords: any[];
          };
          error?: string;
        };
        serpstat: {
          connected: boolean;
          projectId: string | null;
          data?: {
            overview: any;
            topKeywords: any[];
            rankTracker?: {
              keywords: any[];
              distribution: any;
              total: number;
            };
          };
          error?: string;
        };
      } = {
        gsc: { connected: false, propertyUrl: gscPropertyUrl },
        ga4: { connected: false, propertyId: gaPropertyId },
        ahrefs: { connected: false },
        serpstat: { connected: false, projectId: serpstatProjectId },
      };

      // Fetch GSC data if connected and property is set
      if (googleIntegration && gscPropertyUrl) {
        result.gsc.connected = true;
        try {
          const [performance, topQueries] = await Promise.all([
            this.gscService.getPerformance(organizationId, gscPropertyUrl,
              new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              new Date().toISOString().split('T')[0]),
            this.gscService.getTopQueries(organizationId, gscPropertyUrl, { limit: 5 }),
          ]);
          result.gsc.data = {
            performance,
            topQueries: topQueries.queries,
          };
        } catch (error) {
          this.logger.error('GSC fetch error:', error);
          result.gsc.error = error instanceof Error ? error.message : 'Failed to fetch GSC data';
        }
      } else if (googleIntegration && !gscPropertyUrl) {
        result.gsc.connected = true;
        result.gsc.error = 'No GSC property selected for this project';
      }

      // Fetch GA4 data if connected and property is set
      if (googleIntegration && gaPropertyId) {
        result.ga4.connected = true;
        try {
          const overview = await this.gscService.getGa4Overview(organizationId, gaPropertyId);
          result.ga4.data = { overview };
        } catch (error) {
          this.logger.error('GA4 fetch error:', error);
          result.ga4.error = error instanceof Error ? error.message : 'Failed to fetch GA4 data';
        }
      } else if (googleIntegration && !gaPropertyId) {
        result.ga4.connected = true;
        result.ga4.error = 'No GA4 property selected for this project';
      }

      // Fetch Ahrefs data if connected
      if (ahrefsIntegration) {
        result.ahrefs.connected = true;
        try {
          const [metrics, keywords] = await Promise.all([
            this.ahrefsService.getDomainMetrics(organizationId, domain),
            this.ahrefsService.getOrganicKeywords(organizationId, domain, { limit: 5 }),
          ]);
          result.ahrefs.data = {
            metrics,
            topKeywords: keywords.keywords,
          };
        } catch (error) {
          this.logger.error('Ahrefs fetch error:', error);
          result.ahrefs.error = error instanceof Error ? error.message : 'Failed to fetch Ahrefs data';
        }
      }

      // Fetch Serpstat data if connected
      if (serpstatIntegration) {
        result.serpstat.connected = true;
        try {
          const [overview, keywords] = await Promise.all([
            this.serpstatService.getDomainOverview(organizationId, domain),
            this.serpstatService.getKeywords(organizationId, domain, { limit: 5 }),
          ]);
          result.serpstat.data = {
            overview,
            topKeywords: keywords.keywords,
          };

          // Fetch Rank Tracker data if project ID is configured
          if (serpstatProjectId) {
            try {
              const rankTracker = await this.serpstatService.getProjectPositions(
                organizationId,
                serpstatProjectId,
                { limit: 10 },
              );
              result.serpstat.data.rankTracker = rankTracker;
            } catch (rankError) {
              this.logger.error('Serpstat Rank Tracker fetch error:', rankError);
              // Don't fail the whole request if rank tracker fails
            }
          }
        } catch (error) {
          this.logger.error('Serpstat fetch error:', error);
          result.serpstat.error = error instanceof Error ? error.message : 'Failed to fetch Serpstat data';
        }
      }

      return result;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch SEO metrics';
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
