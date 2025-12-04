import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { IntegrationsService } from '../integrations/integrations.service';

export interface GscPerformanceData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  startDate: string;
  endDate: string;
}

export interface GscQueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

@Injectable()
export class GscService {
  constructor(
    private integrationsService: IntegrationsService,
  ) {}

  /**
   * Create OAuth2 client for Google API requests
   */
  private async createOAuth2Client(organizationId: string) {
    const integration = await this.integrationsService.findOne(organizationId, 'google');

    if (!integration) {
      throw new UnauthorizedException('Google account not connected');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    // Auto-refresh token if expired
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.integrationsService.update(organizationId, 'google', {
          accessToken: tokens.access_token,
        });
      }
    });

    return oauth2Client;
  }

  async getMetrics(organizationId: string, siteUrl: string, startDate: string, endDate: string) {
    console.log('🔍 GSC Service called with:', { organizationId, siteUrl, startDate, endDate });

    const oauth2Client = await this.createOAuth2Client(organizationId);

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: ['date'],
          rowLimit: 1000,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new UnauthorizedException('Google token expired. Please reconnect.');
      }
      throw error;
    }
  }

  /**
   * Get overall performance metrics for a domain (clicks, impressions, CTR, position)
   */
  async getPerformance(
    organizationId: string,
    siteUrl: string,
    startDate: string,
    endDate: string,
  ): Promise<GscPerformanceData> {
    const oauth2Client = await this.createOAuth2Client(organizationId);

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          // No dimensions = aggregate data
        },
      });

      const rows = response.data.rows || [];
      const totals = rows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      return {
        clicks: totals.clicks || 0,
        impressions: totals.impressions || 0,
        ctr: Math.round((totals.ctr || 0) * 10000) / 100, // Convert to percentage
        position: Math.round((totals.position || 0) * 10) / 10,
        startDate,
        endDate,
      };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new UnauthorizedException('Google token expired. Please reconnect.');
      }
      throw error;
    }
  }

  /**
   * Get top search queries from Google Search Console
   */
  async getTopQueries(
    organizationId: string,
    siteUrl: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ): Promise<{ queries: GscQueryData[]; total: number }> {
    const oauth2Client = await this.createOAuth2Client(organizationId);

    // Default to last 28 days
    const endDate = options.endDate || new Date().toISOString().split('T')[0];
    const startDate = options.startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = options.limit || 20;

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: ['query'],
          rowLimit: limit,
        },
      });

      const queries: GscQueryData[] = (response.data.rows || []).map((row: any) => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100,
        position: Math.round((row.position || 0) * 10) / 10,
      }));

      return {
        queries,
        total: queries.length,
      };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new UnauthorizedException('Google token expired. Please reconnect.');
      }
      throw error;
    }
  }

  /**
   * Get top pages from Google Search Console
   */
  async getTopPages(
    organizationId: string,
    siteUrl: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ): Promise<{ pages: GscPageData[]; total: number }> {
    const oauth2Client = await this.createOAuth2Client(organizationId);

    // Default to last 28 days
    const endDate = options.endDate || new Date().toISOString().split('T')[0];
    const startDate = options.startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const limit = options.limit || 20;

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    try {
      const response = await searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: ['page'],
          rowLimit: limit,
        },
      });

      const pages: GscPageData[] = (response.data.rows || []).map((row: any) => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100,
        position: Math.round((row.position || 0) * 10) / 10,
      }));

      return {
        pages,
        total: pages.length,
      };
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new UnauthorizedException('Google token expired. Please reconnect.');
      }
      throw error;
    }
  }
}