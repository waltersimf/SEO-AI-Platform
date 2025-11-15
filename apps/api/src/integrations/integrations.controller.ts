import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Res,
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
  @UseGuards(JwtAuthGuard, AuthGuard('google'))
  async googleConnect() {
    // Guard redirects to Google
  }

  // Google OAuth: Callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const { accessToken, refreshToken, email, name } = req.user;
    
    // Get organizationId from session or query param
    const organizationId = req.query.state; // We'll pass this in state param
    
    // Save integration to DB
    await this.integrationsService.create({
      organizationId,
      provider: 'google',
      accessToken,
      refreshToken,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      metadata: { email, name },
    });

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google=connected`);
  }
}