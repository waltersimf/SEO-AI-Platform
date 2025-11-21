import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chat';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get('list')
  async listChats(@Req() req) {
    const organizationId = req.user.organizationId;
    const currentUserId = req.user.id;
    return this.chatService.getOrganizationChats(organizationId, currentUserId);
  }

  @Post(':chatId/read')
  async markChatAsRead(@Req() req, @Param('chatId') chatId: string) {
    try {
      if (!req.user || !req.user.id) {
        throw new BadRequestException('User not authenticated');
      }

      return this.chatService.markChatAsRead(chatId, req.user.id);
    } catch (error) {
      console.error('Error marking chat as read:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to mark chat as read';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Get(':id/messages')
  async getChatMessages(@Param('id') chatId: string) {
    return this.chatService.getChatMessages(chatId);
  }

  @Post('direct/:userId')
  async createDirectChat(
    @Req() req,
    @Param('userId') targetUserId: string,
  ) {
    try {
      if (!req.user || !req.user.id) {
        throw new BadRequestException('User not authenticated');
      }

      const currentUserId = req.user.id;
      const organizationId = req.user.organizationId;

      if (currentUserId === targetUserId) {
        throw new BadRequestException('Cannot create direct chat with yourself');
      }

      return this.chatService.createOrGetDirectChat(
        organizationId,
        currentUserId,
        targetUserId,
      );
    } catch (error) {
      console.error('Error in createDirectChat controller:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to create direct chat';
      throw new InternalServerErrorException(errorMessage);
    }
  }

  @Delete(':id')
  async deleteChat(@Req() req, @Param('id') chatId: string) {
    try {
      if (!req.user || !req.user.id) {
        throw new BadRequestException('User not authenticated');
      }

      const userId = req.user.id;

      return this.chatService.deleteChat(chatId, userId);
    } catch (error) {
      console.error('Error in deleteChat controller:', error);

      if (error instanceof BadRequestException ||
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete chat';
      throw new InternalServerErrorException(errorMessage);
    }
  }
}