import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async findByOrganization(organizationId: string, provider?: string) {
    const integrations = await this.prisma.integration.findMany({
      where: {
        organizationId,
        ...(provider && { provider }),
      },
    });

    // Decrypt tokens before returning
    return integrations.map(integration => ({
      ...integration,
      accessToken: this.encryptionService.decrypt(integration.accessToken),
      refreshToken: integration.refreshToken 
        ? this.encryptionService.decrypt(integration.refreshToken)
        : null,
    }));
  }

  async findOne(organizationId: string, provider: string) {
    const integration = await this.prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
    });

    if (!integration) {
      return null;
    }

    // Decrypt tokens before returning
    return {
      ...integration,
      accessToken: this.encryptionService.decrypt(integration.accessToken),
      refreshToken: integration.refreshToken 
        ? this.encryptionService.decrypt(integration.refreshToken)
        : null,
    };
  }

  async create(data: {
    organizationId: string;
    provider: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    scopes: string[];
    metadata?: any;
  }) {
    // Encrypt tokens before saving
    const encryptedData = {
      ...data,
      accessToken: this.encryptionService.encrypt(data.accessToken),
      refreshToken: data.refreshToken 
        ? this.encryptionService.encrypt(data.refreshToken)
        : null,
    };

    return this.prisma.integration.create({
      data: encryptedData,
    });
  }

  async update(organizationId: string, provider: string, data: { accessToken: string }) {
    // Encrypt token before saving
    const encryptedToken = this.encryptionService.encrypt(data.accessToken);

    return this.prisma.integration.update({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
      data: {
        accessToken: encryptedToken,
        updatedAt: new Date(),
      },
    });
  }

  async delete(organizationId: string, provider: string) {
    return this.prisma.integration.delete({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
    });
  }
}