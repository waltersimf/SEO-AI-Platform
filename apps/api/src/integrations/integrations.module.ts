import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from '../common/encryption.service';
import { AhrefsService } from './ahrefs.service';
import { SerpstatService } from './serpstat.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    GoogleStrategy,
    EncryptionService,
    AhrefsService,
    SerpstatService,
  ],
  exports: [IntegrationsService, AhrefsService, SerpstatService],
})
export class IntegrationsModule {}