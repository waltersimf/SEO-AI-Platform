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
    'https://www.googleapis.com/auth/webmasters.readonly'
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
    
    await this.integrationsService.create({
      organizationId,
      provider: 'google',
      accessToken,
      refreshToken,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      metadata: { email, name },
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google=connected`);
  }
}