import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { TaskModule } from '../task/task.module';
import { ChatModule } from '../chat/chat.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    TaskModule,
    ChatModule,
    EventsModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
