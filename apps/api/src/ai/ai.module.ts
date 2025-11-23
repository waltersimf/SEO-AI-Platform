import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';

@Module({
  providers: [AiService, AiContextService],
  exports: [AiService, AiContextService],
})
export class AiModule {}
