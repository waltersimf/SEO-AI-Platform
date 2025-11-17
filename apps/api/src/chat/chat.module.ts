import { Module } from '@nestjs/common';
import { TestGateway } from './test.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TestGateway , ChatService],
  controllers: [ChatController],
})
export class ChatModule {}