import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { GscService } from '../../gsc/gsc.service';
import { AhrefsService } from '../../integrations/ahrefs.service';
import { SerpstatService } from '../../integrations/serpstat.service';
import { IntegrationsService } from '../../integrations/integrations.service';

interface DailySeoJobData {
  organizationId: string;
  organizationName?: string;
  date: string; // YYYY-MM-DD format
}

interface MetricsData {
  // GSC
  gscClicks?: number;
  gscImpressions?: number;
  gscCtr?: number;
  gscPosition?: number;
  // GA4
  ga4Users?: number;
  ga4Sessions?: number;
  ga4Pageviews?: number;
  ga4BounceRate?: number;
  // Ahrefs
  ahrefsDr?: number;
  ahrefsBacklinks?: number;
  ahrefsRefDomains?: number;
  ahrefsOrgKeywords?: number;
  ahrefsOrgTraffic?: number;
  // Serpstat
  serpstatVisibility?: number;
  serpstatKeywords?: number;
  serpstatTraffic?: number;
}

@Processor('daily-seo')
export class DailySeoProcessor extends WorkerHost {
  private readonly logger = new Logger(DailySeoProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gscService: GscService,
    private readonly ahrefsService: AhrefsService,
    private readonly serpstatService: SerpstatService,
    private readonly integrationsService: IntegrationsService,
  ) {
    super();
  }

  async process(job: Job<DailySeoJobData>): Promise<any> {
    const { organizationId, organizationName, date } = job.data;
    this.logger.log(`🚀 Processing daily SEO job for ${organizationName || organizationId} (date: ${date})`);

    const results = {
      organizationId,
      date,
      projectsProcessed: 0,
      projectsSuccess: 0,
      projectsFailed: 0,
      errors: [] as string[],
    };

    try {
      // Get all projects for this organization
      const projects = await this.prisma.project.findMany({
        where: {
          organizationId,
          isDeleted: false,
        },
      });

      this.logger.log(`Found ${projects.length} projects to process`);

      // Check available integrations
      const [googleIntegration, ahrefsIntegration, serpstatIntegration] = await Promise.all([
        this.integrationsService.findOne(organizationId, 'google'),
        this.integrationsService.findOne(organizationId, 'ahrefs'),
        this.integrationsService.findOne(organizationId, 'serpstat'),
      ]);

      this.logger.log(`Integrations available: Google=${!!googleIntegration}, Ahrefs=${!!ahrefsIntegration}, Serpstat=${!!serpstatIntegration}`);

      // Process each project
      for (const project of projects) {
        results.projectsProcessed++;

        try {
          const metrics = await this.fetchProjectMetrics(
            organizationId,
            project,
            {
              hasGoogle: !!googleIntegration,
              hasAhrefs: !!ahrefsIntegration,
              hasSerpstat: !!serpstatIntegration,
            },
          );

          // Save metrics to database
          await this.saveMetrics(project.id, date, metrics);

          results.projectsSuccess++;
          this.logger.log(`✅ Processed metrics for project: ${project.name}`);
        } catch (error) {
          results.projectsFailed++;
          const errorMsg = `Failed to process project ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      this.logger.log(`📊 Job completed: ${results.projectsSuccess}/${results.projectsProcessed} projects successful`);
      return results;
    } catch (error) {
      this.logger.error(`❌ Job failed for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all available metrics for a project
   */
  private async fetchProjectMetrics(
    organizationId: string,
    project: { id: string; name: string; domain: string; gscPropertyUrl: string | null; gaPropertyId: string | null },
    integrations: { hasGoogle: boolean; hasAhrefs: boolean; hasSerpstat: boolean },
  ): Promise<MetricsData> {
    const metrics: MetricsData = {};

    // Calculate date range (yesterday to get complete data)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    const dateStr = endDate.toISOString().split('T')[0];

    // 1. Fetch GSC metrics
    if (integrations.hasGoogle && project.gscPropertyUrl) {
      try {
        this.logger.debug(`Fetching GSC metrics for ${project.name}`);
        const gscData = await this.gscService.getPerformance(
          organizationId,
          project.gscPropertyUrl,
          dateStr,
          dateStr,
        );

        if (gscData) {
          metrics.gscClicks = gscData.clicks || 0;
          metrics.gscImpressions = gscData.impressions || 0;
          metrics.gscCtr = gscData.ctr || 0;
          metrics.gscPosition = gscData.position || 0;
        }
        this.logger.debug(`GSC metrics fetched: clicks=${metrics.gscClicks}, impressions=${metrics.gscImpressions}`);
      } catch (error) {
        this.logger.warn(`Failed to fetch GSC metrics for ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 2. Fetch GA4 metrics
    if (integrations.hasGoogle && project.gaPropertyId) {
      try {
        this.logger.debug(`Fetching GA4 metrics for ${project.name}`);
        const ga4Data = await this.gscService.getGa4Overview(
          organizationId,
          project.gaPropertyId,
          dateStr,
          dateStr,
        );

        if (ga4Data) {
          metrics.ga4Users = ga4Data.totalUsers || 0;
          metrics.ga4Sessions = ga4Data.sessions || 0;
          metrics.ga4Pageviews = ga4Data.screenPageViews || 0;
          metrics.ga4BounceRate = ga4Data.bounceRate || 0;
        }
        this.logger.debug(`GA4 metrics fetched: users=${metrics.ga4Users}, sessions=${metrics.ga4Sessions}`);
      } catch (error) {
        this.logger.warn(`Failed to fetch GA4 metrics for ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 3. Fetch Ahrefs metrics
    if (integrations.hasAhrefs) {
      try {
        this.logger.debug(`Fetching Ahrefs metrics for ${project.name}`);
        const ahrefsData = await this.ahrefsService.getDomainMetrics(
          organizationId,
          project.domain,
        );

        if (ahrefsData) {
          metrics.ahrefsDr = ahrefsData.domainRating || 0;
          metrics.ahrefsBacklinks = ahrefsData.backlinks || 0;
          metrics.ahrefsRefDomains = ahrefsData.refDomains || 0;
          metrics.ahrefsOrgKeywords = ahrefsData.organicKeywords || 0;
          metrics.ahrefsOrgTraffic = ahrefsData.organicTraffic || 0;
        }
        this.logger.debug(`Ahrefs metrics fetched: DR=${metrics.ahrefsDr}, backlinks=${metrics.ahrefsBacklinks}`);
      } catch (error) {
        this.logger.warn(`Failed to fetch Ahrefs metrics for ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 4. Fetch Serpstat metrics
    if (integrations.hasSerpstat) {
      try {
        this.logger.debug(`Fetching Serpstat metrics for ${project.name}`);
        const serpstatData = await this.serpstatService.getDomainOverview(
          organizationId,
          project.domain,
        );

        if (serpstatData) {
          metrics.serpstatVisibility = serpstatData.visibility || 0;
          metrics.serpstatKeywords = serpstatData.keywords || 0;
          metrics.serpstatTraffic = serpstatData.trafficCost || 0;
        }
        this.logger.debug(`Serpstat metrics fetched: visibility=${metrics.serpstatVisibility}, keywords=${metrics.serpstatKeywords}`);
      } catch (error) {
        this.logger.warn(`Failed to fetch Serpstat metrics for ${project.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return metrics;
  }

  /**
   * Save metrics to database (upsert to handle re-runs)
   */
  private async saveMetrics(projectId: string, dateStr: string, metrics: MetricsData) {
    const date = new Date(dateStr);

    await this.prisma.projectMetricsHistory.upsert({
      where: {
        projectId_date: {
          projectId,
          date,
        },
      },
      create: {
        projectId,
        date,
        ...metrics,
      },
      update: {
        ...metrics,
      },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<DailySeoJobData>) {
    this.logger.log(`✅ Job ${job.id} completed for organization ${job.data.organizationId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<DailySeoJobData>, error: Error) {
    this.logger.error(`❌ Job ${job.id} failed for organization ${job.data.organizationId}: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<DailySeoJobData>, progress: number) {
    this.logger.log(`📈 Job ${job.id} progress: ${progress}%`);
  }
}
