import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

export interface SerpstatDomainOverview {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  organicCost: number;
  adKeywords: number;
  adTraffic: number;
  adCost: number;
  serpstatRank: number;
  visibilityIndex: number;
}

export interface SerpstatKeyword {
  keyword: string;
  position: number;
  volume: number;
  cpc: number;
  competition: number;
  url: string;
  trafficPercent: number;
}

interface SerpstatApiResponse<T> {
  result?: {
    data?: T;
    summary?: any;
  };
  status_code?: number;
  status_msg?: string;
}

@Injectable()
export class SerpstatService {
  private readonly baseUrl = 'https://api.serpstat.com/v4';

  constructor(private integrationsService: IntegrationsService) {}

  private async getCredentials(organizationId: string): Promise<{ apiKey: string; accountId: string }> {
    const integration = await this.integrationsService.findOne(organizationId, 'serpstat');

    if (!integration) {
      throw new UnauthorizedException('Serpstat not connected. Please add your API key in settings.');
    }

    const metadata = integration.metadata as { accountId?: string } || {};

    return {
      apiKey: integration.accessToken, // Already decrypted
      accountId: metadata.accountId || '',
    };
  }

  private async makeRequest<T>(
    organizationId: string,
    method: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    const { apiKey } = await this.getCredentials(organizationId);

    const body = {
      id: '1',
      method,
      params: {
        ...params,
        token: apiKey,
      },
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadRequestException(`Serpstat API error: ${response.statusText}`);
    }

    const data: SerpstatApiResponse<T> = await response.json();

    if (data.status_code && data.status_code !== 200) {
      if (data.status_code === 401 || data.status_code === 403) {
        throw new UnauthorizedException('Invalid Serpstat API key');
      }
      throw new BadRequestException(data.status_msg || 'Serpstat API error');
    }

    return data.result?.data as T;
  }

  /**
   * Test if the API key is valid
   */
  async testConnection(organizationId: string): Promise<{ valid: boolean; message: string }> {
    try {
      const { apiKey } = await this.getCredentials(organizationId);

      const body = {
        id: '1',
        method: 'SerpstatLimitsProcedure.getStats',
        params: {
          token: apiKey,
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return { valid: false, message: `API error: ${response.statusText}` };
      }

      const data = await response.json() as SerpstatApiResponse<{ left_lines?: number }>;

      if (data.status_code && data.status_code !== 200) {
        return { valid: false, message: data.status_msg || 'Invalid API key' };
      }

      const limits = data.result?.data;
      return {
        valid: true,
        message: `Connected. Requests left: ${limits?.left_lines || 'N/A'}`,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return { valid: false, message: 'Serpstat not connected' };
      }
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Get domain overview (visibility, traffic estimates, etc.)
   */
  async getDomainOverview(
    organizationId: string,
    domain: string,
    options: {
      searchEngine?: string; // 'g_us', 'g_ua', 'g_uk', etc.
    } = {},
  ): Promise<SerpstatDomainOverview> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const se = options.searchEngine || 'g_us';

    const data = await this.makeRequest<any>(
      organizationId,
      'SerpstatDomainProcedure.getDomainsInfo',
      {
        domain: cleanDomain,
        se,
      },
    );

    const domainData = Array.isArray(data) ? data[0] : data;

    return {
      domain: cleanDomain,
      organicKeywords: domainData?.organic_keywords || 0,
      organicTraffic: domainData?.organic_traffic || 0,
      organicCost: domainData?.organic_cost || 0,
      adKeywords: domainData?.ad_keywords || 0,
      adTraffic: domainData?.ad_traffic || 0,
      adCost: domainData?.ad_cost || 0,
      serpstatRank: domainData?.serpstat_rank || 0,
      visibilityIndex: domainData?.visible || 0,
    };
  }

  /**
   * Get keywords for a domain
   */
  async getKeywords(
    organizationId: string,
    domain: string,
    options: {
      searchEngine?: string;
      limit?: number;
      offset?: number;
      sort?: 'traffic' | 'volume' | 'position';
    } = {},
  ): Promise<{ keywords: SerpstatKeyword[]; total: number }> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const se = options.searchEngine || 'g_us';

    const data = await this.makeRequest<any[]>(
      organizationId,
      'SerpstatDomainProcedure.getDomainKeywords',
      {
        domain: cleanDomain,
        se,
        size: options.limit || 100,
        page: Math.floor((options.offset || 0) / (options.limit || 100)) + 1,
        sort: this.mapSortField(options.sort),
        order: 'desc',
      },
    );

    const keywords = (data || []).map((kw: any) => ({
      keyword: kw.keyword || '',
      position: kw.position || 0,
      volume: kw.volume || 0,
      cpc: kw.cpc || 0,
      competition: kw.competition || 0,
      url: kw.url || '',
      trafficPercent: kw.traffic_percent || 0,
    }));

    return {
      keywords,
      total: keywords.length,
    };
  }

  private mapSortField(sort?: string): string {
    switch (sort) {
      case 'traffic':
        return 'traffic_percent';
      case 'volume':
        return 'region_queries_count';
      case 'position':
        return 'position';
      default:
        return 'traffic_percent';
    }
  }

  /**
   * Save Serpstat API key and account ID for organization
   */
  async saveCredentials(
    organizationId: string,
    apiKey: string,
    accountId?: string,
  ): Promise<void> {
    await this.integrationsService.createOrUpdate({
      organizationId,
      provider: 'serpstat',
      accessToken: apiKey,
      scopes: ['domain-overview', 'keywords', 'competitors'],
      metadata: {
        accountId: accountId || '',
        connectedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Disconnect Serpstat integration
   */
  async disconnect(organizationId: string): Promise<void> {
    await this.integrationsService.delete(organizationId, 'serpstat');
  }
}
