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
      throw new WsException('Failed to create chat');
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