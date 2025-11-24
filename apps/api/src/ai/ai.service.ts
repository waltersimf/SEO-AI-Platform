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
  async generateResponse(prompt: string, context?: Record<string, any>): Promise<string> {
    if (!this.anthropic) {
      this.logger.warn('AI service not configured, returning fallback message');
      return 'AI assistant is currently unavailable. Please configure ANTHROPIC_API_KEY.';
    }

    try {
      const model = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';
      const maxTokens = this.configService.get<number>('AI_MAX_TOKENS') || 4096;
      const temperature = this.configService.get<number>('AI_TEMPERATURE') || 0.7;

      const systemPrompt = this.buildSystemPrompt(context);

      this.logger.debug(`Generating AI response with model: ${model}`);

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from the response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .join('\n');

      return textContent || 'I apologize, but I was unable to generate a response.';
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
      return 'I apologize, but I encountered an error while processing your request. Please try again.';
    }
  }

  /**
   * Build system prompt for the AI assistant
   */
  private buildSystemPrompt(context?: Record<string, any>): string {
    let prompt = `You are an AI assistant for Forgeline, an SEO platform that helps teams collaborate on SEO projects.

Your role is to:
- Help with SEO-related questions and analysis
- Provide insights on search engine optimization strategies
- Assist with understanding Google Search Console data
- Guide users on best practices for website optimization
- Answer questions about SEO metrics and performance

Be concise, professional, and helpful. When discussing SEO topics:
- Provide actionable recommendations
- Explain technical concepts in an accessible way
- Reference data and metrics when relevant
- Stay up-to-date with current SEO best practices

Always maintain a friendly and supportive tone.`;

    if (context && Object.keys(context).length > 0) {
      prompt += '\n\nAdditional context:\n' + JSON.stringify(context, null, 2);
    }

    return prompt;
  }

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return this.anthropic !== null;
  }
}
