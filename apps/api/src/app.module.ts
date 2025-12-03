import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { GscModule } from './gsc/gsc.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';
import { ProjectsModule } from './projects/projects.module';
import { TaskModule } from './task/task.module';
import { EventsModule } from './events/events.module';
import { SettingsModule } from './settings/settings.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { InviteModule } from './invite/invite.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EventsModule,
    AuthModule,
    IntegrationsModule,
    GscModule,
    ChatModule,
    UsersModule,
    AiModule,
    ProjectsModule,
    TaskModule,
    SettingsModule,
    SchedulerModule,
    InviteModule,
    TeamModule,
  ],
})
export class AppModule {}