import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GoogleStrategy], // ← ДОДАЙ GoogleStrategy
  exports: [IntegrationsService],
})
export class IntegrationsModule {}