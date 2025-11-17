import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [PrismaModule],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}