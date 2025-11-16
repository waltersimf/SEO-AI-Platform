import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class GscService {
  constructor(
    private integrationsService: IntegrationsService,
  ) {}

  async getMetrics(organizationId: string, siteUrl: string, startDate: string, endDate: string) {
    console.log('🔍 GSC Service called with:', { organizationId, siteUrl, startDate, endDate });
    
    // Use IntegrationsService to get decrypted tokens
    const integration = await this.integrationsService.findOne(organizationId, 'google');

    console.log('✅ Integration found:', {
      hasAccessToken: !!integration?.accessToken,
      hasRefreshToken: !!integration?.refreshToken,
    });

    if (!integration) {
      throw new UnauthorizedException('Google account not connected');
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Set credentials
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

    // Create Search Console client
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
}