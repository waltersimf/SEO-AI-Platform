import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationsModule } from './integrations/integrations.module'; // ← ДОДАЙ ЦЕЙ IMPORT
import { GscModule } from './gsc/gsc.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
  ConfigModule.forRoot({
   isGlobal: true,
    envFilePath: '../../.env', // ← ДОДАЙ ЦЕЙ РЯДОК
  }),
    PrismaModule,
    AuthModule,
    IntegrationsModule, // ← ДОДАЙ СЮДИ
    GscModule,
    ChatModule,
  ],
})
export class AppModule {}