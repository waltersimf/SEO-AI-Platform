import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(chatId: string, authorId: string, content: string) {
    try {
      const message = await this.prisma.message.create({
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
            },
          },
        },
      });

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw new WsException('Failed to create message');
    }
  }

  async getChatMessages(chatId: string, limit = 100) {
    try {
      const messages = await this.prisma.message.findMany({
        where: { chatId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new WsException('Failed to fetch messages');
    }
  }

  async createChat(organizationId: string, name: string, memberIds: string[]) {
    try {
      // Validate inputs
      if (!organizationId) {
        throw new WsException('Organization ID is required');
      }

      if (!name || name.trim().length === 0) {
        throw new WsException('Chat name is required');
      }

      if (!memberIds || memberIds.length === 0) {
        throw new WsException('At least one member is required');
      }

      // Verify that all user IDs exist and belong to the organization
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: memberIds },
          organizationId: organizationId,
        },
        select: { id: true },
      });

      if (users.length !== memberIds.length) {
        const foundIds = users.map(u => u.id);
        const missingIds = memberIds.filter(id => !foundIds.includes(id));
        throw new WsException(
          `Invalid user IDs or users not in organization: ${missingIds.join(', ')}`
        );
      }

      const chat = await this.prisma.chat.create({
        data: {
          organizationId,
          name,
          members: {
            create: memberIds.map((userId) => ({
              userId,
            })),
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);

      // Re-throw WsException errors as-is
      if (error instanceof WsException) {
        throw error;
      }

      // Handle Prisma-specific errors
      if ((error as any).code === 'P2002') {
        throw new WsException('A chat with this name already exists');
      }

      if ((error as any).code === 'P2003') {
        throw new WsException('Invalid organization or user reference');
      }

      // Generic error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new WsException(`Failed to create chat: ${errorMessage}`);
    }
  }

  async getOrganizationChats(organizationId: string) {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { organizationId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return chats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw new WsException('Failed to fetch chats');
    }
  }
}