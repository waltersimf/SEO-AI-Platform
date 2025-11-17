import { Module } from '@nestjs/common';
// import { ChatGateway } from './chat.gateway';    // ❌ Старий з TypeError
import { TestGateway } from './test.gateway';       // ✅ Новий з online status
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [
    TestGateway,    // ✅ Використовуємо TestGateway з online status
    // ChatGateway, // ❌ Старий закоментований
    ChatService,
  ],
})
export class ChatModule {}