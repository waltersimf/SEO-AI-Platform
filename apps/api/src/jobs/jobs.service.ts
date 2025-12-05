import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('daily-seo') private dailySeoQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('JobsService initialized');

    // Log queue connection status
    const isReady = await this.dailySeoQueue.client;
    this.logger.log(`BullMQ queue 'daily-seo' connected: ${!!isReady}`);
  }

  /**
   * Scheduled job: runs every day at 6:00 AM
   */
  @Cron('0 6 * * *', {
    name: 'daily-seo-fetch',
    timeZone: 'Europe/Kyiv',
  })
  async scheduleDailySeoFetch() {
    this.logger.log('🕕 Cron triggered: scheduling daily SEO fetch for all organizations');

    try {
      // Get all organizations
      const organizations = await this.prisma.organization.findMany({
        select: { id: true, name: true },
      });

      this.logger.log(`Found ${organizations.length} organizations to process`);

      // Add a job for each organization
      for (const org of organizations) {
        await this.addDailySeoJob(org.id, org.name);
      }

      this.logger.log(`✅ Scheduled ${organizations.length} daily SEO jobs`);
    } catch (error) {
      this.logger.error('❌ Failed to schedule daily SEO jobs:', error);
    }
  }

  /**
   * Add a daily SEO fetch job to the queue for a specific organization
   */
  async addDailySeoJob(organizationId: string, organizationName?: string) {
    const jobId = `daily-seo-${organizationId}-${new Date().toISOString().split('T')[0]}`;

    const job = await this.dailySeoQueue.add(
      'fetch-metrics',
      {
        organizationId,
        organizationName,
        date: new Date().toISOString().split('T')[0],
      },
      {
        jobId,
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with 1 minute delay
        },
      },
    );

    this.logger.log(`📋 Added job ${job.id} for organization: ${organizationName || organizationId}`);
    return job;
  }

  /**
   * Trigger daily SEO fetch manually (for testing)
   */
  async triggerManually(organizationId?: string) {
    this.logger.log(`🔧 Manual trigger: daily SEO fetch${organizationId ? ` for org ${organizationId}` : ' for all organizations'}`);

    if (organizationId) {
      // Single organization
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true },
      });

      if (!org) {
        throw new Error(`Organization not found: ${organizationId}`);
      }

      const job = await this.addDailySeoJob(org.id, org.name);
      return { jobId: job.id, organizationId: org.id, organizationName: org.name };
    }

    // All organizations
    const organizations = await this.prisma.organization.findMany({
      select: { id: true, name: true },
    });

    const jobs = [];
    for (const org of organizations) {
      const job = await this.addDailySeoJob(org.id, org.name);
      jobs.push({ jobId: job.id, organizationId: org.id, organizationName: org.name });
    }

    return { totalJobs: jobs.length, jobs };
  }

  /**
   * Get job queue status
   */
  async getQueueStatus() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.dailySeoQueue.getWaitingCount(),
      this.dailySeoQueue.getActiveCount(),
      this.dailySeoQueue.getCompletedCount(),
      this.dailySeoQueue.getFailedCount(),
      this.dailySeoQueue.getDelayedCount(),
    ]);

    return {
      queueName: 'daily-seo',
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
    };
  }

  /**
   * Get metrics history for a project
   */
  async getMetricsHistory(projectId: string, limit = 30) {
    return this.prisma.projectMetricsHistory.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  /**
   * Get latest metrics for all projects in an organization
   */
  async getLatestMetrics(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      include: {
        metricsHistory: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    return projects.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      domain: project.domain,
      latestMetrics: project.metricsHistory[0] || null,
    }));
  }
}
