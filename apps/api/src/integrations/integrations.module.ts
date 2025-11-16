import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, GoogleStrategy, EncryptionService,], // ← ДОДАЙ GoogleStrategy
  exports: [IntegrationsService],
})
export class IntegrationsModule {}