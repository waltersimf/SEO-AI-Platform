import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface MetricAverages {
  gscClicks: number;
  gscImpressions: number;
  gscCtr: number;
  gscPosition: number;
  ga4Users: number;
  ga4Sessions: number;
  ga4Pageviews: number;
}

export interface Insight {
  projectId: string;
  projectName?: string;
  projectDomain?: string;
  metric: string;
  type: 'positive' | 'negative' | 'neutral';
  change: number;
  currentValue: number;
  previousValue: number;
  label: string;
  unit?: string;
  message: string;
}

export interface DetailedAnalysis {
  project: {
    id: string;
    name: string;
    domain: string;
  } | null;
  insights: Insight[];
  integrations: {
    gscConnected: boolean;
    ga4Connected: boolean;
  };
  latestMetrics: {
    gscClicks: number | null;
    gscImpressions: number | null;
    gscCtr: number | null;
    gscPosition: number | null;
    ga4Users: number | null;
    ga4Sessions: number | null;
    ga4Pageviews: number | null;
  } | null;
  previousMetrics: {
    gscClicks: number | null;
    gscImpressions: number | null;
    gscCtr: number | null;
    gscPosition: number | null;
    ga4Users: number | null;
    ga4Sessions: number | null;
    ga4Pageviews: number | null;
  } | null;
  recommendations: string[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get insights for all projects in organization
   */
  async getOrganizationInsights(organizationId: string): Promise<Insight[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      select: { id: true, name: true, domain: true },
    });

    const insights: Insight[] = [];

    for (const project of projects) {
      const projectInsights = await this.analyzeProject(project.id);
      insights.push(
        ...projectInsights.map((i) => ({
          ...i,
          projectName: project.name,
          projectDomain: project.domain,
        })),
      );
    }

    // Sort by absolute change value (most significant first)
    insights.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return insights;
  }

  /**
   * Analyze single project
   */
  async analyzeProject(projectId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get metrics from last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const metrics = await this.prisma.projectMetricsHistory.findMany({
      where: {
        projectId,
        date: { gte: twoWeeksAgo },
      },
      orderBy: { date: 'desc' },
    });

    if (metrics.length < 2) return insights;

    // Compare this week vs last week
    const thisWeek = metrics.slice(0, 7);
    const lastWeek = metrics.slice(7, 14);

    if (thisWeek.length === 0 || lastWeek.length === 0) return insights;

    // Calculate averages
    const avgThisWeek = this.calculateAverages(thisWeek);
    const avgLastWeek = this.calculateAverages(lastWeek);

    // Check for significant changes (>=10%)
    const checkChange = (
      metric: string,
      current: number,
      previous: number,
      label: string,
      unit: string = '',
      inversePositive: boolean = false, // For metrics where lower is better (like position)
    ) => {
      if (previous === 0) return;
      const change = ((current - previous) / previous) * 100;
      if (Math.abs(change) >= 10) {
        // For position, lower is better so we invert the type
        const type = inversePositive
          ? change < 0
            ? 'positive'
            : 'negative'
          : change > 0
            ? 'positive'
            : 'negative';

        insights.push({
          projectId,
          metric,
          type,
          change: Math.round(change),
          currentValue: current,
          previousValue: previous,
          label,
          unit,
          message: `${label}: ${change > 0 ? '+' : ''}${Math.round(change)}% (${previous.toLocaleString()}${unit} → ${current.toLocaleString()}${unit})`,
        });
      }
    };

    // GSC metrics
    checkChange('gscClicks', avgThisWeek.gscClicks, avgLastWeek.gscClicks, 'Кліки GSC');
    checkChange('gscImpressions', avgThisWeek.gscImpressions, avgLastWeek.gscImpressions, 'Покази GSC');
    checkChange('gscCtr', avgThisWeek.gscCtr, avgLastWeek.gscCtr, 'CTR', '%');
    checkChange('gscPosition', avgThisWeek.gscPosition, avgLastWeek.gscPosition, 'Позиція', '', true);

    // GA4 metrics
    checkChange('ga4Users', avgThisWeek.ga4Users, avgLastWeek.ga4Users, 'Користувачі GA4');
    checkChange('ga4Sessions', avgThisWeek.ga4Sessions, avgLastWeek.ga4Sessions, 'Сесії');
    checkChange('ga4Pageviews', avgThisWeek.ga4Pageviews, avgLastWeek.ga4Pageviews, 'Перегляди');

    return insights;
  }

  /**
   * Calculate averages for metrics
   */
  private calculateAverages(
    metrics: Array<{
      gscClicks: number | null;
      gscImpressions: number | null;
      gscCtr: number | null;
      gscPosition: number | null;
      ga4Users: number | null;
      ga4Sessions: number | null;
      ga4Pageviews: number | null;
    }>,
  ): MetricAverages {
    const sum = metrics.reduce(
      (acc, m) => ({
        gscClicks: acc.gscClicks + (m.gscClicks || 0),
        gscImpressions: acc.gscImpressions + (m.gscImpressions || 0),
        gscCtr: acc.gscCtr + (m.gscCtr || 0),
        gscPosition: acc.gscPosition + (m.gscPosition || 0),
        ga4Users: acc.ga4Users + (m.ga4Users || 0),
        ga4Sessions: acc.ga4Sessions + (m.ga4Sessions || 0),
        ga4Pageviews: acc.ga4Pageviews + (m.ga4Pageviews || 0),
      }),
      {
        gscClicks: 0,
        gscImpressions: 0,
        gscCtr: 0,
        gscPosition: 0,
        ga4Users: 0,
        ga4Sessions: 0,
        ga4Pageviews: 0,
      },
    );

    const count = metrics.length || 1;
    return {
      gscClicks: Math.round(sum.gscClicks / count),
      gscImpressions: Math.round(sum.gscImpressions / count),
      gscCtr: Number((sum.gscCtr / count).toFixed(2)),
      gscPosition: Number((sum.gscPosition / count).toFixed(1)),
      ga4Users: Math.round(sum.ga4Users / count),
      ga4Sessions: Math.round(sum.ga4Sessions / count),
      ga4Pageviews: Math.round(sum.ga4Pageviews / count),
    };
  }

  /**
   * Get detailed analysis for AI chat
   */
  async getDetailedAnalysis(projectId: string): Promise<DetailedAnalysis> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        domain: true,
        gscPropertyUrl: true,
        gaPropertyId: true,
      },
    });

    const insights = await this.analyzeProject(projectId);

    // Check integration status
    const integrations = {
      gscConnected: !!project?.gscPropertyUrl,
      ga4Connected: !!project?.gaPropertyId,
    };

    // Get latest metrics
    const latestMetrics = await this.prisma.projectMetricsHistory.findFirst({
      where: { projectId },
      orderBy: { date: 'desc' },
      select: {
        gscClicks: true,
        gscImpressions: true,
        gscCtr: true,
        gscPosition: true,
        ga4Users: true,
        ga4Sessions: true,
        ga4Pageviews: true,
      },
    });

    // Get metrics from 7 days ago for comparison
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const previousMetrics = await this.prisma.projectMetricsHistory.findFirst({
      where: {
        projectId,
        date: { lte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
      select: {
        gscClicks: true,
        gscImpressions: true,
        gscCtr: true,
        gscPosition: true,
        ga4Users: true,
        ga4Sessions: true,
        ga4Pageviews: true,
      },
    });

    return {
      project: project
        ? { id: project.id, name: project.name, domain: project.domain }
        : null,
      insights,
      integrations,
      latestMetrics,
      previousMetrics,
      recommendations: this.generateRecommendations(insights),
    };
  }

  /**
   * Generate recommendations based on insights
   */
  private generateRecommendations(insights: Insight[]): string[] {
    const recommendations: string[] = [];

    for (const insight of insights) {
      if (insight.type === 'negative') {
        switch (insight.metric) {
          case 'gscClicks':
            recommendations.push('Перевірте meta descriptions та titles для покращення CTR');
            break;
          case 'gscCtr':
            recommendations.push('Оптимізуйте сніпети в пошуку - додайте структуровані дані');
            break;
          case 'gscPosition':
            recommendations.push('Позиції впали - перевірте контент та внутрішню перелінковку');
            break;
          case 'ga4Users':
            recommendations.push('Трафік зменшився - проаналізуйте джерела трафіку');
            break;
          case 'ga4Sessions':
            recommendations.push('Сесії зменшились - перевірте технічний стан сайту');
            break;
          case 'ga4Pageviews':
            recommendations.push('Перегляди впали - покращте внутрішню навігацію');
            break;
        }
      }
    }

    // Remove duplicates and return
    return [...new Set(recommendations)];
  }
}
