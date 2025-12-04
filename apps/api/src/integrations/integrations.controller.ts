import {
  BadRequestException,
  Controller,
  Get,
  Delete,
  Post,
  Param,
  UseGuards,
  Req,
  Res,
  Query,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { google } from 'googleapis';
import { AhrefsService } from './ahrefs.service';
import { SerpstatService } from './serpstat.service';
import { ConnectAhrefsDto, ConnectSerpstatDto } from './dto/seo-tools.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private integrationsService: IntegrationsService,
    private ahrefsService: AhrefsService,
    private serpstatService: SerpstatService,
  ) {}

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
    const integration = await this.integrationsService.findOne(organizationId, provider);

    if (!integration) {
      throw new NotFoundException(`Integration for ${provider} not found`);
    }

    // Return a clean response without exposing tokens
    return {
      id: integration.id,
      provider: integration.provider,
      connected: true,
      scopes: integration.scopes,
      metadata: integration.metadata,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
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
  @UseGuards(JwtAuthGuard)
  googleConnect(@Req() req, @Res() res) {
    const organizationId = req.user.organizationId;

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

  // Helper to get OAuth2 client for Google APIs
  private async getGoogleOAuth2Client(organizationId: string) {
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

    return oauth2Client;
  }

  // Get Google Drive files
  @Get('google/drive/files')
  @UseGuards(JwtAuthGuard)
  async getDriveFiles(@Req() req) {
    const organizationId = req.user.organizationId;
    const oauth2Client = await this.getGoogleOAuth2Client(organizationId);

    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const response = await drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, mimeType, webViewLink)',
      });

      return {
        files: response.data.files || [],
      };
    } catch (error) {
      console.error('Error fetching Drive files:', error instanceof Error ? error.message : error);
      throw new BadRequestException('Failed to fetch Drive files');
    }
  }

  // Create a test Google Doc
  @Post('google/docs/create')
  @UseGuards(JwtAuthGuard)
  async createTestDoc(@Req() req) {
    const organizationId = req.user.organizationId;
    const oauth2Client = await this.getGoogleOAuth2Client(organizationId);

    try {
      const docs = google.docs({ version: 'v1', auth: oauth2Client });
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const response = await docs.documents.create({
        requestBody: {
          title: `Forgeline Test Doc - ${timestamp}`,
        },
      });

      const documentId = response.data.documentId;

      return {
        documentId,
        title: response.data.title,
        webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
      };
    } catch (error) {
      console.error('Error creating Google Doc:', error instanceof Error ? error.message : error);
      throw new BadRequestException('Failed to create Google Doc');
    }
  }

  // Create a test Google Sheet
  @Post('google/sheets/create')
  @UseGuards(JwtAuthGuard)
  async createTestSheet(@Req() req) {
    const organizationId = req.user.organizationId;
    const oauth2Client = await this.getGoogleOAuth2Client(organizationId);

    try {
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Forgeline Test Sheet - ${timestamp}`,
          },
        },
      });

      return {
        spreadsheetId: response.data.spreadsheetId,
        title: response.data.properties?.title,
        webViewLink: response.data.spreadsheetUrl,
      };
    } catch (error) {
      console.error('Error creating Google Sheet:', error instanceof Error ? error.message : error);
      throw new BadRequestException('Failed to create Google Sheet');
    }
  }

  // =========================================
  // AHREFS INTEGRATION
  // =========================================

  // Connect Ahrefs API key
  @Post('ahrefs/connect')
  @UseGuards(JwtAuthGuard)
  async connectAhrefs(@Req() req, @Body() dto: ConnectAhrefsDto) {
    const organizationId = req.user.organizationId;

    await this.ahrefsService.saveApiKey(organizationId, dto.apiKey);

    // Test the connection
    const testResult = await this.ahrefsService.testConnection(organizationId);

    if (!testResult.valid) {
      // If invalid, remove the saved key
      await this.ahrefsService.disconnect(organizationId);
      throw new BadRequestException(testResult.message);
    }

    return {
      connected: true,
      message: testResult.message,
    };
  }

  // Test Ahrefs connection
  @Get('ahrefs/test')
  @UseGuards(JwtAuthGuard)
  async testAhrefsConnection(@Req() req) {
    const organizationId = req.user.organizationId;
    return this.ahrefsService.testConnection(organizationId);
  }

  // Get Ahrefs domain metrics
  @Get('ahrefs/domain-metrics')
  @UseGuards(JwtAuthGuard)
  async getAhrefsDomainMetrics(@Req() req, @Query('domain') domain: string) {
    if (!domain) {
      throw new BadRequestException('Domain parameter is required');
    }

    const organizationId = req.user.organizationId;
    return this.ahrefsService.getDomainMetrics(organizationId, domain);
  }

  // Get Ahrefs organic keywords
  @Get('ahrefs/organic-keywords')
  @UseGuards(JwtAuthGuard)
  async getAhrefsOrganicKeywords(
    @Req() req,
    @Query('domain') domain: string,
    @Query('country') country?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!domain) {
      throw new BadRequestException('Domain parameter is required');
    }

    const organizationId = req.user.organizationId;
    return this.ahrefsService.getOrganicKeywords(organizationId, domain, {
      country,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // Disconnect Ahrefs
  @Delete('ahrefs')
  @UseGuards(JwtAuthGuard)
  async disconnectAhrefs(@Req() req) {
    const organizationId = req.user.organizationId;
    await this.ahrefsService.disconnect(organizationId);
    return { success: true };
  }

  // =========================================
  // SERPSTAT INTEGRATION
  // =========================================

  // Connect Serpstat API key
  @Post('serpstat/connect')
  @UseGuards(JwtAuthGuard)
  async connectSerpstat(@Req() req, @Body() dto: ConnectSerpstatDto) {
    const organizationId = req.user.organizationId;

    await this.serpstatService.saveCredentials(organizationId, dto.apiKey, dto.accountId);

    // Test the connection
    const testResult = await this.serpstatService.testConnection(organizationId);

    if (!testResult.valid) {
      // If invalid, remove the saved key
      await this.serpstatService.disconnect(organizationId);
      throw new BadRequestException(testResult.message);
    }

    return {
      connected: true,
      message: testResult.message,
    };
  }

  // Test Serpstat connection
  @Get('serpstat/test')
  @UseGuards(JwtAuthGuard)
  async testSerpstatConnection(@Req() req) {
    const organizationId = req.user.organizationId;
    return this.serpstatService.testConnection(organizationId);
  }

  // Get Serpstat domain overview
  @Get('serpstat/domain-overview')
  @UseGuards(JwtAuthGuard)
  async getSerpstatDomainOverview(
    @Req() req,
    @Query('domain') domain: string,
    @Query('searchEngine') searchEngine?: string,
  ) {
    if (!domain) {
      throw new BadRequestException('Domain parameter is required');
    }

    const organizationId = req.user.organizationId;
    return this.serpstatService.getDomainOverview(organizationId, domain, { searchEngine });
  }

  // Get Serpstat keywords
  @Get('serpstat/keywords')
  @UseGuards(JwtAuthGuard)
  async getSerpstatKeywords(
    @Req() req,
    @Query('domain') domain: string,
    @Query('searchEngine') searchEngine?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort?: 'traffic' | 'volume' | 'position',
  ) {
    if (!domain) {
      throw new BadRequestException('Domain parameter is required');
    }

    const organizationId = req.user.organizationId;
    return this.serpstatService.getKeywords(organizationId, domain, {
      searchEngine,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sort,
    });
  }

  // Disconnect Serpstat
  @Delete('serpstat')
  @UseGuards(JwtAuthGuard)
  async disconnectSerpstat(@Req() req) {
    const organizationId = req.user.organizationId;
    await this.serpstatService.disconnect(organizationId);
    return { success: true };
  }
}