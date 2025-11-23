import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey || apiKey === 'sk-ant-your-key-here') {
      this.logger.warn(
        '⚠️  ANTHROPIC_API_KEY not configured. AI features will be disabled.',
      );
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({
        apiKey,
      });
      this.logger.log('✅ Claude API initialized');
    }
  }

  /**
   * Generate a response using Claude AI
   */
  async generateResponse(_prompt: string): Promise<string> {
    if (!this.anthropic) {
      return 'AI response coming soon!';
    }

    // TODO: Implement actual Claude API call in later phase
    return 'AI response coming soon!';
  }

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return this.anthropic !== null;
  }
}
