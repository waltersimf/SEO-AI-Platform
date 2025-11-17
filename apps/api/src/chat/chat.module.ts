import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';       // ✅ ChatGateway
// import { TestGateway } from './test.gateway';    // ❌ Видаляємо import
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,    // ✅ Використовуємо ChatGateway
    // TestGateway, // ❌ Видаляємо TestGateway
    ChatService,
  ],
})
export class ChatModule {}