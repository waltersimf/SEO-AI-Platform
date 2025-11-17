import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('create')
  async createChat(
    @Req() req,
    @Body() body: { name: string; memberIds: string[] },
  ) {
    const organizationId = req.user.organizationId;
    return this.chatService.createChat(
      organizationId,
      body.name,
      body.memberIds,
    );
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