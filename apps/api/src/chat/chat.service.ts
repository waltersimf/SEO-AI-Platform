import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
              avatar: true,
              isAI: true,
            },
          },
          chat: {
            select: {
              organizationId: true,
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

  async createAIMessage(
    chatId: string,
    authorId: string,
    content: string,
    aiModel: string,
    aiContext?: Record<string, any>,
  ) {
    try {
      const message = await this.prisma.message.create({
        data: {
          chatId,
          authorId,
          content,
          isAIResponse: true,
          aiModel,
          aiContext: aiContext || {},
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isAI: true,
            },
          },
          chat: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      return message;
    } catch (error) {
      console.error('Error creating AI message:', error);
      throw new WsException('Failed to create AI message');
    }
  }

  async getChatMessages(chatId: string, limit = 100) {
    try {
      const messages = await this.prisma.message.findMany({
        where: { chatId },
        select: {
          id: true,
          chatId: true,
          authorId: true,
          content: true,
          isAIResponse: true,
          aiContext: true, // Explicitly include aiContext
          aiModel: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isAI: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      // Log messages with aiContext for debugging
      const messagesWithAiContext = messages.filter(m => m.aiContext);
      if (messagesWithAiContext.length > 0) {
        console.log('📋 Messages with aiContext:', messagesWithAiContext.map(m => ({
          id: m.id,
          aiContext: m.aiContext,
        })));
      }

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

  async getOrganizationChats(organizationId: string, currentUserId?: string) {
    try {
      // Build where clause - only return chats the user is a member of
      const where: any = { organizationId };

      if (currentUserId) {
        where.members = {
          some: { userId: currentUserId }
        };
      }

      const chats = await this.prisma.chat.findMany({
        where,
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
        orderBy: { updatedAt: 'desc' },
      });

      // Calculate unread count for each chat
      if (currentUserId) {
        const chatsWithUnread = await Promise.all(
          chats.map(async (chat) => {
            // Find current user's membership
            const membership = await this.prisma.chatMember.findUnique({
              where: {
                userId_chatId: {
                  userId: currentUserId,
                  chatId: chat.id,
                },
              },
            });

            // Count unread messages
            const unreadCount = await this.prisma.message.count({
              where: {
                chatId: chat.id,
                authorId: { not: currentUserId }, // Don't count own messages
                createdAt: membership?.lastReadAt
                  ? { gt: membership.lastReadAt }
                  : undefined, // All messages if never read
              },
            });

            return {
              ...chat,
              unreadCount,
            };
          }),
        );

        return chatsWithUnread;
      }

      return chats.map((chat) => ({ ...chat, unreadCount: 0 }));
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw new WsException('Failed to fetch chats');
    }
  }

  async markChatAsRead(chatId: string, userId: string) {
    try {
      // Update lastReadAt to current time
      await this.prisma.chatMember.upsert({
        where: {
          userId_chatId: {
            userId,
            chatId,
          },
        },
        update: {
          lastReadAt: new Date(),
        },
        create: {
          userId,
          chatId,
          lastReadAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking chat as read:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new WsException(`Failed to mark chat as read: ${errorMessage}`);
    }
  }

  async createOrGetDirectChat(organizationId: string, user1Id: string, user2Id: string) {
    try {
      // Validate that both users belong to the same organization
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: [user1Id, user2Id] },
          organizationId: organizationId,
        },
      });

      if (users.length !== 2) {
        throw new WsException('Both users must exist and belong to the same organization');
      }

      // Check if direct chat already exists between these two users
      const existingChat = await this.prisma.chat.findFirst({
        where: {
          organizationId,
          type: 'direct',
          AND: [
            { members: { some: { userId: user1Id } } },
            { members: { some: { userId: user2Id } } },
          ],
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

      if (existingChat) {
        return existingChat;
      }

      // Create new direct chat
      const chat = await this.prisma.chat.create({
        data: {
          organizationId,
          type: 'direct',
          name: null,
          members: {
            create: [
              { userId: user1Id },
              { userId: user2Id },
            ],
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
      console.error('Error creating/getting direct chat:', error);

      if (error instanceof WsException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new WsException(`Failed to create direct chat: ${errorMessage}`);
    }
  }

  async deleteChat(chatId: string, userId: string) {
    try {
      // First, check if the chat exists
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      // Check if the user is a member of the chat
      const isMember = chat.members.some(member => member.userId === userId);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this chat');
      }

      // Delete the chat (cascade will delete messages and members)
      await this.prisma.chat.delete({
        where: { id: chatId },
      });

      return {
        success: true,
        message: 'Chat deleted successfully',
        chatId,
      };
    } catch (error) {
      console.error('Error deleting chat:', error);

      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new WsException(`Failed to delete chat: ${errorMessage}`);
    }
  }
}