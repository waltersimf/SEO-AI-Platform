import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(organizationId: string, name: string, memberIds: string[]) {
    return this.prisma.chat.create({
      data: {
        name,
        organizationId,
        members: {
          create: memberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async getOrganizationChats(organizationId: string) {
    return this.prisma.chat.findMany({
      where: { organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getChatMessages(chatId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { chatId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async createMessage(chatId: string, authorId: string, content: string) {
    return this.prisma.message.create({
      data: {
        chatId,
        authorId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}