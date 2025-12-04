import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { GscModule } from '../gsc/gsc.module';

@Module({
  imports: [IntegrationsModule, GscModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
