import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

export interface AhrefsDomainMetrics {
  domain: string;
  domainRating: number;
  urlRating: number;
  backlinks: number;
  referringDomains: number;
  organicKeywords: number;
  organicTraffic: number;
}

export interface AhrefsKeyword {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  position: number;
  url: string;
  traffic: number;
}

interface AhrefsApiResponse<T> {
  metrics?: T;
  keywords?: T[];
  error?: string;
}

@Injectable()
export class AhrefsService {
  private readonly baseUrl = 'https://api.ahrefs.com/v3';

  constructor(private integrationsService: IntegrationsService) {}

  private async getApiKey(organizationId: string): Promise<string> {
    const integration = await this.integrationsService.findOne(organizationId, 'ahrefs');

    if (!integration) {
      throw new UnauthorizedException('Ahrefs not connected. Please add your API key in settings.');
    }

    return integration.accessToken; // Already decrypted by IntegrationsService
  }

  private async makeRequest<T>(
    organizationId: string,
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const apiKey = await this.getApiKey(organizationId);

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };

      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException('Invalid Ahrefs API key');
      }

      throw new BadRequestException(
        errorData.error || `Ahrefs API error: ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Test if the API key is valid
   */
  async testConnection(organizationId: string): Promise<{ valid: boolean; message: string }> {
    try {
      const apiKey = await this.getApiKey(organizationId);

      // Use limits-and-usage endpoint to validate key
      // Docs: https://docs.ahrefs.com/reference/subscription-info-limits-and-usage
      const response = await fetch(`${this.baseUrl}/subscription-info/limits-and-usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json() as {
          limits_and_usage?: {
            subscription?: string;
            units_usage?: number;
            units_limit?: number;
          };
        };
        const info = data.limits_and_usage;
        return {
          valid: true,
          message: `Connected. ${info?.subscription || 'Active'}. Usage: ${info?.units_usage || 0}/${info?.units_limit || 'N/A'}`
        };
      }

      if (response.status === 401 || response.status === 403) {
        return { valid: false, message: 'Invalid API key' };
      }

      return { valid: false, message: `API error: ${response.statusText}` };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return { valid: false, message: 'Ahrefs not connected' };
      }
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format (Ahrefs data is delayed by 1 day)
   */
  private getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Get domain metrics (Domain Rating, backlinks, etc.)
   */
  async getDomainMetrics(
    organizationId: string,
    domain: string,
  ): Promise<AhrefsDomainMetrics> {
    // Clean domain (remove protocol and trailing slash)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const date = this.getYesterdayDate();

    try {
      const data = await this.makeRequest<AhrefsApiResponse<any>>(
        organizationId,
        '/site-explorer/domain-rating',
        {
          target: cleanDomain,
          date: date,
          mode: 'subdomains',
        },
      );

      // Also fetch backlinks data
      const backlinksData = await this.makeRequest<AhrefsApiResponse<any>>(
        organizationId,
        '/site-explorer/metrics',
        {
          target: cleanDomain,
          date: date,
          mode: 'subdomains',
        },
      );

      return {
        domain: cleanDomain,
        domainRating: data.metrics?.domain_rating || 0,
        urlRating: data.metrics?.url_rating || 0,
        backlinks: backlinksData.metrics?.backlinks || 0,
        referringDomains: backlinksData.metrics?.referring_domains || 0,
        organicKeywords: backlinksData.metrics?.organic_keywords || 0,
        organicTraffic: backlinksData.metrics?.organic_traffic || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get organic keywords for a domain
   */
  async getOrganicKeywords(
    organizationId: string,
    domain: string,
    options: {
      country?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ keywords: AhrefsKeyword[]; total: number }> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const date = this.getYesterdayDate();

    const data = await this.makeRequest<{ keywords?: any[] }>(
      organizationId,
      '/site-explorer/organic-keywords',
      {
        target: cleanDomain,
        date: date,
        select: 'keyword,best_position,volume,sum_traffic,keyword_difficulty',
        country: options.country || 'ua',
        limit: String(options.limit || 5),
        offset: String(options.offset || 0),
        order_by: 'sum_traffic:desc',
      },
    );

    const keywords = (data.keywords || []).map((kw: any) => ({
      keyword: kw.keyword || '',
      volume: kw.volume || 0,
      difficulty: kw.keyword_difficulty || 0,
      cpc: kw.cpc || 0,
      position: kw.best_position || kw.position || 0,
      url: kw.url || '',
      traffic: kw.sum_traffic || kw.traffic || 0,
    }));

    return {
      keywords,
      total: keywords.length,
    };
  }

  /**
   * Save Ahrefs API key for organization
   */
  async saveApiKey(organizationId: string, apiKey: string): Promise<void> {
    await this.integrationsService.createOrUpdate({
      organizationId,
      provider: 'ahrefs',
      accessToken: apiKey,
      scopes: ['domain-rating', 'organic-keywords', 'backlinks'],
      metadata: {
        connectedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Disconnect Ahrefs integration
   */
  async disconnect(organizationId: string): Promise<void> {
    await this.integrationsService.delete(organizationId, 'ahrefs');
  }
}
