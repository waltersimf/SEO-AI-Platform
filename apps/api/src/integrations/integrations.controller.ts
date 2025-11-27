import {
  BadRequestException,
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { google } from 'googleapis';

@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  // Get all integrations for organization
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Req() req) {
    const organizationId = req.user.organizationId;
    return this.integrationsService.findByOrganization(organizationId);
  }

  // Get specific integration
  @Get(':provider')
  @UseGuards(JwtAuthGuard)
  async getOne(@Req() req, @Param('provider') provider: string) {
    const organizationId = req.user.organizationId;
    return this.integrationsService.findOne(organizationId, provider);
  }

  // Delete integration
  @Delete(':provider')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req, @Param('provider') provider: string) {
    const organizationId = req.user.organizationId;
    return this.integrationsService.delete(organizationId, provider);
  }

  // Google OAuth: Initiate
@Get('google/connect')
// @UseGuards(JwtAuthGuard)  // TODO v0.3: Enable when cookies auth is ready
googleConnect(@Res() res) {
  // TODO v0.3: Get from req.user.organizationId when JWT guard enabled
  const organizationId = 'cmi03mh7f0001nuvzjw3w1oq8';

  const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');

  const scopes = [
    'email',
    'profile',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/spreadsheets',
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`;

  res.redirect(authUrl);
}

  // Google OAuth: Callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res, @Query('state') state: string) {
    const { accessToken, refreshToken, email, name } = req.user;
    
    // Decode organizationId from state
    let organizationId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      organizationId = decoded.organizationId;
    } catch (error) {
      throw new BadRequestException('Invalid state parameter');
    }
    
    await this.integrationsService.createOrUpdate({
      organizationId,
      provider: 'google',
      accessToken,
      refreshToken,
      scopes: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      metadata: { email, name },
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google=connected`);
  }

  // Get available Google properties (GSC and GA4)
  @Get('google/properties')
  @UseGuards(JwtAuthGuard)
  async getGoogleProperties(@Req() req) {
    const organizationId = req.user.organizationId;

    // Get Google integration
    const integration = await this.integrationsService.findOne(organizationId, 'google');
    if (!integration) {
      throw new BadRequestException('Google account not connected');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const gscProperties: Array<{ siteUrl: string; permissionLevel: string }> = [];
    const gaProperties: Array<{ propertyId: string; displayName: string }> = [];

    // Fetch GSC properties
    try {
      const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
      const sitesResponse = await webmasters.sites.list();

      if (sitesResponse.data.siteEntry) {
        for (const site of sitesResponse.data.siteEntry) {
          gscProperties.push({
            siteUrl: site.siteUrl || '',
            permissionLevel: site.permissionLevel || 'unknown',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching GSC properties:', error instanceof Error ? error.message : error);
    }

    // Fetch GA4 properties
    try {
      const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });

      // First get account summaries which includes properties
      const accountsResponse = await analyticsAdmin.accountSummaries.list();

      if (accountsResponse.data.accountSummaries) {
        for (const account of accountsResponse.data.accountSummaries) {
          if (account.propertySummaries) {
            for (const property of account.propertySummaries) {
              gaProperties.push({
                propertyId: property.property?.replace('properties/', '') || '',
                displayName: property.displayName || 'Unnamed Property',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching GA4 properties:', error instanceof Error ? error.message : error);
    }

    return {
      gscProperties,
      gaProperties,
    };
  }
}