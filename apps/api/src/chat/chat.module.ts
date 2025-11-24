import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { TestGateway } from './test.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,    // ✅ ChatGateway with AI integration
    TestGateway,    // ✅ TestGateway with online status
    ChatService,
  ],
})
export class ChatModule {}