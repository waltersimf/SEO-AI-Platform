import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAutoPlanSettingsDto } from './dto/update-auto-plan-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getAutoPlanSettings(organizationId: string) {
    let settings = await this.prisma.autoPlanSettings.findUnique({
      where: { organizationId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.autoPlanSettings.create({
        data: {
          organizationId,
          enabled: false,
          frequency: 'weekly',
          dayOfWeek: 1, // Monday
          time: '08:00',
          notifyBeforeApply: true,
          autoApply: false,
        },
      });
    }

    return settings;
  }

  async updateAutoPlanSettings(
    organizationId: string,
    data: UpdateAutoPlanSettingsDto,
  ) {
    // Calculate next run time if settings are being enabled or changed
    let nextRunAt: Date | null = null;

    if (data.enabled !== false) {
      const frequency = data.frequency || 'weekly';
      const dayOfWeek = data.dayOfWeek ?? 1;
      const time = data.time || '08:00';

      nextRunAt = this.calculateNextRunTime(frequency, dayOfWeek, time);
    }

    const settings = await this.prisma.autoPlanSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...data,
        nextRunAt,
      },
      update: {
        ...data,
        nextRunAt,
      },
    });

    this.logger.log(
      `Updated auto-plan settings for org ${organizationId}: enabled=${settings.enabled}, frequency=${settings.frequency}`,
    );

    return settings;
  }

  /**
   * Calculate the next scheduled run time based on frequency and settings
   */
  calculateNextRunTime(
    frequency: string,
    dayOfWeek: number,
    time: string,
  ): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    // Start with today at the specified time
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
      // If the time has already passed today, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else if (frequency === 'weekly') {
      // Find the next occurrence of the specified day of week
      const currentDay = now.getDay();
      let daysUntilNext = dayOfWeek - currentDay;

      if (daysUntilNext < 0) {
        daysUntilNext += 7;
      } else if (daysUntilNext === 0 && next <= now) {
        // If today is the scheduled day but time has passed, schedule for next week
        daysUntilNext = 7;
      }

      next.setDate(next.getDate() + daysUntilNext);
    }

    return next;
  }

  /**
   * Get all organizations with auto-plan enabled that should run now
   */
  async getOrganizationsToAutoPlan(): Promise<
    Array<{
      organizationId: string;
      notifyBeforeApply: boolean;
      autoApply: boolean;
    }>
  > {
    const now = new Date();

    const settings = await this.prisma.autoPlanSettings.findMany({
      where: {
        enabled: true,
        nextRunAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        organizationId: true,
        notifyBeforeApply: true,
        autoApply: true,
        frequency: true,
        dayOfWeek: true,
        time: true,
      },
    });

    // Update nextRunAt for each matched setting
    for (const setting of settings) {
      const nextRunAt = this.calculateNextRunTime(
        setting.frequency,
        setting.dayOfWeek,
        setting.time,
      );

      await this.prisma.autoPlanSettings.update({
        where: { id: setting.id },
        data: {
          lastRunAt: now,
          nextRunAt,
        },
      });
    }

    return settings.map((s) => ({
      organizationId: s.organizationId,
      notifyBeforeApply: s.notifyBeforeApply,
      autoApply: s.autoApply,
    }));
  }
}
