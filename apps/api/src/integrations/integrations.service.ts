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
    const decryptedToken = this.encryptionService.decrypt(integration.accessToken);
    console.log(`[IntegrationsService] findOne ${provider}: encrypted length=${integration.accessToken?.length}, decrypted length=${decryptedToken?.length}`);

    return {
      ...integration,
      accessToken: decryptedToken,
      refreshToken: integration.refreshToken
        ? this.encryptionService.decrypt(integration.refreshToken)
        : null,
    };
  }

  async createOrUpdate(data: {
    organizationId: string;
    provider: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    scopes: string[];
    metadata?: any;
  }) {
    // Encrypt tokens before saving
    const encryptedAccessToken = this.encryptionService.encrypt(data.accessToken);
    const encryptedRefreshToken = data.refreshToken
      ? this.encryptionService.encrypt(data.refreshToken)
      : null;

    return this.prisma.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId: data.organizationId,
          provider: data.provider,
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: data.tokenExpiry,
        scopes: data.scopes,
        metadata: data.metadata,
        updatedAt: new Date(),
      },
      create: {
        organizationId: data.organizationId,
        provider: data.provider,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: data.tokenExpiry,
        scopes: data.scopes,
        metadata: data.metadata,
      },
    });
  }

  async update(organizationId: string, provider: string, data: { accessToken?: string; metadata?: any }) {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.accessToken) {
      updateData.accessToken = this.encryptionService.encrypt(data.accessToken);
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    return this.prisma.integration.update({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
      data: updateData,
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