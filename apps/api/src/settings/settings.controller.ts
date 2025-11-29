import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateAutoPlanSettingsDto } from './dto/update-auto-plan-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('auto-plan')
  async getAutoPlanSettings(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.settingsService.getAutoPlanSettings(organizationId);
  }

  @Post('auto-plan')
  async updateAutoPlanSettings(
    @Req() req: any,
    @Body() data: UpdateAutoPlanSettingsDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.settingsService.updateAutoPlanSettings(organizationId, data);
  }
}
