import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService, AiContextService],
  exports: [AiService, AiContextService],
})
export class AiModule {}
