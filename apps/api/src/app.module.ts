import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { GscModule } from './gsc/gsc.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
  ConfigModule.forRoot({
   isGlobal: true,
    envFilePath: '../../.env',
  }),
    PrismaModule,
    AuthModule,
    IntegrationsModule,
    GscModule,
    ChatModule,
    UsersModule,
    AiModule,
  ],
})
export class AppModule {}