import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getOrganizationUsers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobRole: true,
        avatar: true,
        isAI: true,
        isOnline: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
