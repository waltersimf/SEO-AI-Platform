import { Module } from '@nestjs/common';
import { GscController } from './gsc.controller';
import { GscService } from './gsc.service';
import { IntegrationsModule } from '../integrations/integrations.module';


@Module({
  imports: [IntegrationsModule],
  controllers: [GscController],
  providers: [GscService],
  exports: [GscService],
})
export class GscModule {}