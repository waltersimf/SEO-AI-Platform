import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  authorName: string;
  timestamp: Date;
}

export interface AiContext {
  conversationHistory: ConversationMessage[];
  participants: Array<{ id: string; name: string; isAI: boolean }>;
  chatId: string;
}

@Injectable()
export class AiContextService {
  private readonly logger = new Logger(AiContextService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build context for AI based on chat history, integrations, and other data
   */
  async buildContext(chatId: string, _aiUserId: string): Promise<AiContext> {
    try {
      this.logger.debug(`Building context for chat ${chatId}`);

      // Fetch last 10 messages from the chat
      const messages = await this.prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              isAI: true,
            },
          },
        },
      });

      // Reverse to get chronological order (oldest to newest)
      messages.reverse();

      // Format messages for conversation history
      const conversationHistory: ConversationMessage[] = messages.map((msg) => ({
        role: msg.author.isAI ? 'assistant' : 'user',
        content: msg.content,
        authorName: msg.author.name,
        timestamp: msg.createdAt,
      }));

      // Fetch chat members (participants)
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  isAI: true,
                },
              },
            },
          },
        },
      });

      // Extract participants from chat members
      const participants = chat?.members.map((member) => member.user) || [];

      this.logger.debug(
        `Context built: ${conversationHistory.length} messages, ${participants.length} participants`,
      );

      return {
        conversationHistory,
        participants,
        chatId,
      };
    } catch (error) {
      this.logger.error('Error building context:', error);
      return {
        conversationHistory: [],
        participants: [],
        chatId,
      };
    }
  }
}
