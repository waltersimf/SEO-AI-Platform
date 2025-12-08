import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user is a member of a chat
   */
  async isChatMember(chatId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
      },
    });
    return !!membership;
  }

  /**
   * Private method to save message to database (DRY)
   */
  private async saveMessageToDb(data: {
    chatId: string;
    authorId: string;
    content: string;
    isAIResponse?: boolean;
    aiModel?: string;
    aiContext?: Record<string, any>;
  }) {
    return this.prisma.message.create({
      data: {
        chatId: data.chatId,
        authorId: data.authorId,
        content: data.content,
        isAIResponse: data.isAIResponse ?? false,
        aiModel: data.aiModel,
        aiContext: data.aiContext || {},
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
  }

  async createMessage(chatId: string, authorId: string, content: string) {
    try {
      return await this.saveMessageToDb({ chatId, authorId, content });
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
      return await this.saveMessageToDb({
        chatId,
        authorId,
        content,
        isAIResponse: true,
        aiModel,
        aiContext,
      });
    } catch (error) {
      console.error('Error creating AI message:', error);
      throw new WsException('Failed to create AI message');
    }
  }

  async getChatMessages(chatId: string, userId: string, limit = 100) {
    try {
      // Security: Verify user is a member of this chat
      const membership = await this.prisma.chatMember.findFirst({
        where: {
          chatId,
          userId,
        },
      });

      if (!membership) {
        throw new ForbiddenException('Not a member of this chat');
      }

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
          editedAt: true,
          deletedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isAI: true,
            },
          },
          reactions: {
            select: {
              id: true,
              emoji: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
      if (error instanceof ForbiddenException) {
        throw error;
      }
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

  // ==========================================
  // Message Reactions, Edit, and Delete
  // ==========================================

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      // Check if reaction already exists
      const existing = await this.prisma.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
      });

      if (existing) {
        return existing;
      }

      const reaction = await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reaction;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new WsException('Failed to add reaction');
    }
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, userId: string, emoji: string) {
    try {
      const deleted = await this.prisma.messageReaction.deleteMany({
        where: {
          messageId,
          userId,
          emoji,
        },
      });

      return { success: deleted.count > 0 };
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new WsException('Failed to remove reaction');
    }
  }

  /**
   * Edit a message (only author can edit)
   */
  async editMessage(messageId: string, userId: string, content: string) {
    try {
      // Find the message and check ownership
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        select: { authorId: true, deletedAt: true },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.authorId !== userId) {
        throw new ForbiddenException('You can only edit your own messages');
      }

      if (message.deletedAt) {
        throw new ForbiddenException('Cannot edit deleted message');
      }

      const updatedMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          editedAt: new Date(),
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
          reactions: {
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

      return updatedMessage;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error editing message:', error);
      throw new WsException('Failed to edit message');
    }
  }

  /**
   * Soft delete a message (only author can delete)
   */
  async softDeleteMessage(messageId: string, userId: string) {
    try {
      // Find the message and check ownership
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        select: { authorId: true, chatId: true, deletedAt: true },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.authorId !== userId) {
        throw new ForbiddenException('You can only delete your own messages');
      }

      if (message.deletedAt) {
        throw new ForbiddenException('Message already deleted');
      }

      const updatedMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          deletedAt: new Date(),
        },
        select: {
          id: true,
          chatId: true,
          authorId: true,
          deletedAt: true,
        },
      });

      return updatedMessage;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error deleting message:', error);
      throw new WsException('Failed to delete message');
    }
  }

  /**
   * Get reactions for a message
   */
  async getMessageReactions(messageId: string) {
    try {
      const reactions = await this.prisma.messageReaction.findMany({
        where: { messageId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reactions;
    } catch (error) {
      console.error('Error fetching reactions:', error);
      throw new WsException('Failed to fetch reactions');
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