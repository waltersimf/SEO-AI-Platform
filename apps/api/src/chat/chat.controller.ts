import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('create')
  async createChat(
    @Req() req,
    @Body() body: { name: string; memberIds?: string[] },
  ) {
    try {
      // Validate request body
      if (!body.name || body.name.trim().length === 0) {
        throw new BadRequestException('Chat name is required');
      }

      // Validate user authentication
      if (!req.user || !req.user.organizationId) {
        throw new BadRequestException('User not authenticated or missing organization');
      }

      if (!req.user.id) {
        throw new BadRequestException('User ID not found in session');
      }

      const organizationId = req.user.organizationId;
      const currentUserId = req.user.id;

      // If no memberIds provided, use current user
      let memberIds = body.memberIds || [];

      // Always include current user if not already in the list
      if (!memberIds.includes(currentUserId)) {
        memberIds = [currentUserId, ...memberIds];
      }

      // Remove duplicates
      memberIds = [...new Set(memberIds)];

      return this.chatService.createChat(
        organizationId,
        body.name.trim(),
        memberIds,
      );
    } catch (error) {
      console.error('Error in createChat controller:', error);

      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Wrap other errors
      throw new InternalServerErrorException(
        error.message || 'Failed to create chat'
      );
    }
  }

  @Get('list')
  async listChats(@Req() req) {
    const organizationId = req.user.organizationId;
    return this.chatService.getOrganizationChats(organizationId);
  }

  @Get(':id/messages')
  async getChatMessages(@Param('id') chatId: string) {
    return this.chatService.getChatMessages(chatId);
  }
}