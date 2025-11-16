import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async findByOrganization(organizationId: string, provider?: string) {
    return this.prisma.integration.findMany({
      where: {
        organizationId,
        ...(provider && { provider }),
      },
    });
  }

  async findOne(organizationId: string, provider: string) {
    return this.prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
    });
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
    return this.prisma.integration.create({
      data,
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
  async update(organizationId: string, provider: string, data: { accessToken: string }) {
  return this.prisma.integration.update({
    where: {
      organizationId_provider: {
        organizationId,
        provider,
      },
    },
    data: {
      accessToken: data.accessToken,
      updatedAt: new Date(),
    },
  });
}
}