import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiContextService } from './ai-context.service';

class AiChatDto {
  message: string;
  chatId: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly aiContextService: AiContextService,
  ) {}

  @Post('chat')
  async chat(@Body() body: AiChatDto) {
    const { message, chatId } = body;

    this.logger.log(`AI chat request for chatId: ${chatId}`);

    try {
      // Build context for the AI (will be implemented later)
      const context = await this.aiContextService.buildContext(chatId, 'system');

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
