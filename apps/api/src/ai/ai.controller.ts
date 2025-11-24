import { Controller, Post, Body, Logger, UseGuards, OnModuleInit } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';
import { PrismaService } from '../prisma/prisma.service';

class AiChatDto {
  message: string;
  chatId: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController implements OnModuleInit {
  private readonly logger = new Logger(AiController.name);
  private aiUserId: string | null = null;

  constructor(
    private readonly aiService: AiService,
    private readonly aiContextService: AiContextService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Find the AI user on module initialization
    try {
      const aiUser = await this.prisma.user.findFirst({
        where: { isAI: true },
      });

      if (aiUser) {
        this.aiUserId = aiUser.id;
        this.logger.log(`AI user found: ${aiUser.email} (${aiUser.id})`);
      } else {
        this.logger.warn('AI user not found in database. AI controller will use fallback.');
      }
    } catch (error) {
      this.logger.error('Error finding AI user:', error);
    }
  }

  @Post('chat')
  async chat(@Body() body: AiChatDto) {
    const { message, chatId } = body;

    this.logger.log(`AI chat request for chatId: ${chatId}`);

    try {
      if (!this.aiUserId) {
        return {
          success: false,
          error: 'AI user not configured',
        };
      }

      // Build context for the AI with conversation history
      const context = await this.aiContextService.buildContext(chatId, this.aiUserId);

      // Generate AI response
      const response = await this.aiService.generateResponse(message, context);

      return {
        success: true,
        response,
      };
    } catch (error) {
      this.logger.error('Error in AI chat endpoint:', error);
      return {
        success: false,
        error: 'Failed to generate AI response',
      };
    }
  }
}
