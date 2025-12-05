import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { DailySeoProcessor } from './processors/daily-seo.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ProjectsModule } from '../projects/projects.module';
import { GscModule } from '../gsc/gsc.module';

@Module({
  imports: [
    // BullMQ configuration with Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    // Register the daily-seo queue
    BullModule.registerQueue({
      name: 'daily-seo',
    }),
    PrismaModule,
    IntegrationsModule,
    ProjectsModule,
    GscModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, DailySeoProcessor],
  exports: [JobsService],
})
export class JobsModule {}
