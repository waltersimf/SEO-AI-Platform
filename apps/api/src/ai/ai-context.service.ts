import { Injectable } from '@nestjs/common';

@Injectable()
export class AiContextService {
  /**
   * TODO: Implement in Day 8-10
   * Build context for AI based on chat history, integrations, and other data
   * Will need to inject PrismaService when implementing
   */
  async buildContext(_chatId: string, _userId: string): Promise<Record<string, any>> {
    // Return empty object for now
    return {};
  }
}
