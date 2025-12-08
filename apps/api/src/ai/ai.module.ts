import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';
import { AiController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { GscModule } from '../gsc/gsc.module';
import { ProjectsModule } from '../projects/projects.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, IntegrationsModule, GscModule, ProjectsModule, AnalyticsModule],
  controllers: [AiController],
  providers: [AiService, AiContextService],
  exports: [AiService, AiContextService],
})
export class AiModule {}
