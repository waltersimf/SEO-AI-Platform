import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AiService } from '../ai/ai.service';
import { AiContextService } from '../ai/ai-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskService } from '../task/task.service';
import { Role } from '@prisma/client';

interface ConnectedClient {
  socketId: string;
  userId?: string;
  userName?: string;
  connectedAt: Date;
  reconnectAttempts: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private aiUserId: string | null = null;

  constructor(
    private chatService: ChatService,
    private aiService: AiService,
    private aiContextService: AiContextService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private taskService: TaskService,
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
        this.logger.warn('AI user not found in database. AI responses will be disabled.');
      }
    } catch (error) {
      this.logger.error('Error finding AI user:', error);
    }
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Setup global error handler
    server.on('connection_error', (error) => {
      this.logger.error('Connection error:', error);
    });
  }

  handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);

      // Track connected client
      this.connectedClients.set(client.id, {
        socketId: client.id,
        connectedAt: new Date(),
        reconnectAttempts: 0,
      });

      // Setup client-specific error handlers
      client.on('error', (error) => {
        this.logger.error(`Client ${client.id} error:`, error);
        client.emit('error', {
          message: 'Connection error occurred',
          code: 'CONNECTION_ERROR',
        });
      });

      // Handle client disconnect event
      client.on('disconnect', (reason) => {
        this.logger.log(`Client ${client.id} disconnected. Reason: ${reason}`);

        // Notify about reconnection policy
        if (reason === 'transport close' || reason === 'ping timeout') {
          const clientData = this.connectedClients.get(client.id);
          if (clientData && clientData.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this.logger.log(`Client ${client.id} can attempt reconnection`);
          }
        }
      });

      // Send successful connection acknowledgment
      client.emit('connected', {
        socketId: client.id,
        serverTime: new Date().toISOString(),
        maxReconnectAttempts: this.MAX_RECONNECT_ATTEMPTS,
      });

    } catch (error) {
      this.logger.error(`Error in handleConnection for ${client.id}:`, error);
      client.emit('error', {
        message: 'Failed to establish connection',
        code: 'CONNECTION_FAILED',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const clientData = this.connectedClients.get(client.id);

      if (clientData) {
        this.logger.log(
          `Client disconnected: ${client.id} (User: ${clientData.userId || 'anonymous'}, Connected: ${clientData.connectedAt})`,
        );

        // Notify rooms about user going offline
        if (clientData.userId) {
          client.rooms.forEach((room) => {
            if (room !== client.id) {
              this.server.to(room).emit('user_offline', {
                userId: clientData.userId,
                userName: clientData.userName,
                disconnectedAt: new Date().toISOString(),
              });
            }
          });
        }

        // Remove from connected clients
        this.connectedClients.delete(client.id);
      }

      this.logger.log(`Total connected clients: ${this.connectedClients.size}`);
    } catch (error) {
      this.logger.error(`Error in handleDisconnect for ${client.id}:`, error);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; userId: string; userName: string },
  ) {
    try {
      if (!payload?.chatId) {
        client.emit('error', {
          message: 'Chat ID is required',
          code: 'INVALID_CHAT_ID',
        });
        return { success: false, error: 'Chat ID is required' };
      }

      if (!payload?.userId) {
        client.emit('error', {
          message: 'User ID is required',
          code: 'INVALID_USER_ID',
        });
        return { success: false, error: 'User ID is required' };
      }

      // Security: Verify user is a member of this chat before joining
      const isMember = await this.chatService.isChatMember(payload.chatId, payload.userId);
      if (!isMember) {
        this.logger.warn(
          `Unauthorized join attempt: userId=${payload.userId}, chatId=${payload.chatId}`,
        );
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this chat',
        });
        return { success: false, error: 'Not authorized for this chat' };
      }

      // Update client data with user info
      const clientData = this.connectedClients.get(client.id);
      if (clientData) {
        clientData.userId = payload.userId;
        clientData.userName = payload.userName;
        this.connectedClients.set(client.id, clientData);
      }

      // Join the room
      client.join(payload.chatId);
      this.logger.log(
        `Client ${client.id} (${payload.userName}) joined room ${payload.chatId}`,
      );

      // Mark chat as read when user joins
      await this.chatService.markChatAsRead(payload.chatId, payload.userId);
      this.logger.log(`Marked chat ${payload.chatId} as read for user ${payload.userId}`);

      // Notify others in the room
      client.to(payload.chatId).emit('user_joined', {
        userId: payload.userId,
        userName: payload.userName,
        joinedAt: new Date().toISOString(),
      });

      // Emit updated unread count to the user who joined
      client.emit('unread_updated', {
        chatId: payload.chatId,
        unreadCount: 0,
      });

      // Broadcast refresh to update chat list for all connected clients
      this.server.emit('refresh_chat_list', {
        chatId: payload.chatId,
        userId: payload.userId,
        timestamp: new Date(),
      });

      return { success: true, event: 'joined_room', data: payload.chatId };
    } catch (error) {
      this.logger.error(
        `Error joining room: chatId=${payload?.chatId}, userId=${payload?.userId}, clientId=${client.id}`,
        error,
      );
      client.emit('error', {
        message: 'Failed to join chat room',
        code: 'JOIN_ROOM_FAILED',
      });
      return { success: false, error: 'Failed to join room' };
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateMessageDto,
  ) {
    try {
      // Validate payload
      if (!payload?.chatId || !payload?.authorId || !payload?.content) {
        const errorMsg = 'Invalid message payload: chatId, authorId, and content are required';
        this.logger.error(errorMsg);
        client.emit('message_error', {
          message: errorMsg,
          code: 'INVALID_PAYLOAD',
          originalPayload: payload,
        });
        return { success: false, error: errorMsg };
      }

      // Check user role - VIEWER cannot send messages
      const user = await this.prisma.user.findUnique({
        where: { id: payload.authorId },
        select: { role: true },
      });

      if (user?.role === Role.VIEWER) {
        this.logger.warn(`VIEWER user ${payload.authorId} attempted to send message`);
        client.emit('message_error', {
          message: 'You do not have permission to send messages',
          code: 'PERMISSION_DENIED',
        });
        return { success: false, error: 'Permission denied - VIEWER role cannot send messages' };
      }

      // Validate content length
      if (payload.content.trim().length === 0) {
        client.emit('message_error', {
          message: 'Message content cannot be empty',
          code: 'EMPTY_MESSAGE',
        });
        return { success: false, error: 'Message content cannot be empty' };
      }

      if (payload.content.length > 10000) {
        client.emit('message_error', {
          message: 'Message too long (max 10000 characters)',
          code: 'MESSAGE_TOO_LONG',
        });
        return { success: false, error: 'Message too long' };
      }

      this.logger.log(
        `Message from ${client.id} (User: ${payload.authorId}): ${payload.content.substring(0, 50)}...`,
      );

      // Save to database with timeout
      const message = await Promise.race([
        this.chatService.createMessage(
          payload.chatId,
          payload.authorId,
          payload.content,
          payload.replyToId,
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 5000),
        ),
      ]) as any;

      if (!message) {
        throw new Error('Failed to create message in database');
      }

      // Broadcast to all in room
      this.server.to(payload.chatId).emit('receive_message', message);

      // Broadcast to all clients to refresh their chat lists for unread counts
      this.logger.log('🔔 Broadcasting refresh_chat_list to all clients');
      this.server.emit('refresh_chat_list', {
        chatId: message.chatId,
        timestamp: new Date(),
      });

      // Send acknowledgment to sender
      client.emit('message_sent', {
        success: true,
        messageId: message.id,
        timestamp: message.createdAt,
      });

      this.logger.log(`Message ${message.id} delivered to room ${payload.chatId}`);

      // Check if AI should respond
      // AI responds in two cases:
      // 1. User mentions @AI or @assistant
      // 2. It's a direct chat with AI (2 participants, one is AI)
      const shouldRespondToAI = await this.shouldAIRespond(payload.chatId, payload.content);
      if (shouldRespondToAI) {
        this.logger.log('AI should respond, triggering AI response');
        // Run AI response asynchronously to not block the message flow
        setImmediate(() => {
          this.handleAIResponse(payload.chatId);
        });
      }

      return { success: true, message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error handling message: chatId=${payload?.chatId}, userId=${payload?.authorId}, clientId=${client.id}, error=${errorMessage}`,
        error,
      );

      // Emit specific error to client
      client.emit('message_error', {
        message: 'Failed to send message',
        code: 'MESSAGE_SEND_FAILED',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: 'Failed to send message',
        details: errorMessage,
      };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; userId: string; userName: string },
  ) {
    try {
      if (!payload?.chatId || !payload?.userId) {
        client.emit('error', {
          message: 'Invalid typing payload',
          code: 'INVALID_TYPING_PAYLOAD',
        });
        return { success: false };
      }

      client.to(payload.chatId).emit('user_typing', {
        userId: payload.userId,
        userName: payload.userName,
        isTyping: true,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error in typing_start: chatId=${payload?.chatId}, userId=${payload?.userId}, clientId=${client.id}`,
        error,
      );
      return { success: false };
    }
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; userId: string },
  ) {
    try {
      if (!payload?.chatId || !payload?.userId) {
        client.emit('error', {
          message: 'Invalid typing payload',
          code: 'INVALID_TYPING_PAYLOAD',
        });
        return { success: false };
      }

      client.to(payload.chatId).emit('user_typing', {
        userId: payload.userId,
        isTyping: false,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error in typing_stop: chatId=${payload?.chatId}, userId=${payload?.userId}, clientId=${client.id}`,
        error,
      );
      return { success: false };
    }
  }

  @SubscribeMessage('reconnect_attempt')
  handleReconnectAttempt(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; previousSocketId?: string },
  ) {
    try {
      const clientData = this.connectedClients.get(client.id);

      if (!clientData) {
        client.emit('error', {
          message: 'Client not found',
          code: 'CLIENT_NOT_FOUND',
        });
        return { success: false };
      }

      // Increment reconnect attempts
      clientData.reconnectAttempts += 1;

      if (clientData.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
        this.logger.warn(
          `Client ${client.id} exceeded max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS})`,
        );
        client.emit('error', {
          message: 'Maximum reconnection attempts exceeded',
          code: 'MAX_RECONNECT_EXCEEDED',
        });
        client.disconnect();
        return { success: false, error: 'Max reconnect attempts exceeded' };
      }

      this.logger.log(
        `Reconnect attempt ${clientData.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} for user ${payload.userId}`,
      );

      // Update client data
      clientData.userId = payload.userId;
      this.connectedClients.set(client.id, clientData);

      // Notify about successful reconnection
      client.emit('reconnected', {
        success: true,
        socketId: client.id,
        attempt: clientData.reconnectAttempts,
        serverTime: new Date().toISOString(),
      });

      return {
        success: true,
        attempt: clientData.reconnectAttempts,
        maxAttempts: this.MAX_RECONNECT_ATTEMPTS,
      };
    } catch (error) {
      this.logger.error(
        `Error in reconnect_attempt: userId=${payload?.userId}, clientId=${client.id}`,
        error,
      );
      client.emit('error', {
        message: 'Reconnection failed',
        code: 'RECONNECT_FAILED',
      });
      return { success: false, error: 'Reconnection failed' };
    }
  }

  // Health check endpoint for monitoring
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() _client: Socket) {
    return {
      success: true,
      pong: true,
      serverTime: new Date().toISOString(),
      connectedClients: this.connectedClients.size,
    };
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; userId: string },
  ) {
    try {
      if (!payload?.chatId || !payload?.userId) {
        client.emit('error', {
          message: 'Chat ID and User ID are required',
          code: 'INVALID_PAYLOAD',
        });
        return { success: false };
      }

      // Verify user is a member of this chat
      const isMember = await this.chatService.isChatMember(payload.chatId, payload.userId);
      if (!isMember) {
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this chat',
        });
        return { success: false };
      }

      // Mark chat as read
      await this.chatService.markChatAsRead(payload.chatId, payload.userId);
      this.logger.log(`Chat ${payload.chatId} marked as read by user ${payload.userId}`);

      // Emit updated unread count to the user
      client.emit('unread_updated', {
        chatId: payload.chatId,
        unreadCount: 0,
      });

      // Broadcast refresh to update chat list for all connected clients of this user
      this.server.emit('refresh_chat_list', {
        chatId: payload.chatId,
        userId: payload.userId,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error marking chat as read: chatId=${payload?.chatId}, userId=${payload?.userId}`,
        error,
      );
      return { success: false };
    }
  }

  /**
   * Check if a message mentions the AI assistant
   */
  private mentionsAI(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return lowerContent.includes('@ai') || lowerContent.includes('@assistant');
  }

  /**
   * Determine if AI should respond to a message
   * AI responds in two cases:
   * 1. Message mentions @AI or @assistant
   * 2. It's a direct chat with AI (2 participants, one is AI)
   */
  private async shouldAIRespond(chatId: string, content: string): Promise<boolean> {
    // Case 1: Check if message mentions AI
    if (this.mentionsAI(content)) {
      return true;
    }

    // Case 2: Check if it's a direct chat with AI
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  isAI: true,
                },
              },
            },
          },
        },
      });

      if (!chat) {
        return false;
      }

      // Check if chat type is 'direct' and has exactly 2 members
      if (chat.type === 'direct' && chat.members.length === 2) {
        // Check if one of the members is the AI user
        const hasAIUser = chat.members.some(member => member.user.isAI);
        if (hasAIUser) {
          this.logger.log(`Direct chat with AI detected, auto-responding`);
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking if AI should respond:', error);
      return false;
    }
  }

  /**
   * Handle AI response generation and broadcasting
   */
  private async handleAIResponse(chatId: string) {
    if (!this.aiUserId) {
      this.logger.warn('AI user not found, skipping AI response');
      return;
    }

    if (!this.aiService.isConfigured()) {
      this.logger.warn('AI service not configured, skipping AI response');
      return;
    }

    try {
      this.logger.log(`Generating AI response for chat ${chatId}`);

      // Build context for AI (includes last 10 messages with conversation history)
      const context = await this.aiContextService.buildContext(chatId, this.aiUserId);

      // Check if there are any messages in the conversation
      if (context.conversationHistory.length === 0) {
        this.logger.warn('No conversation history found, skipping AI response');
        return;
      }

      // Get the last user message from the conversation history
      const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        this.logger.warn('Last message is not from a user, skipping AI response');
        return;
      }

      // Check if this is an auto-plan request
      if (this.aiService.hasAutoPlanIntent(lastMessage.content)) {
        this.logger.log('Auto-plan intent detected, generating plan...');
        await this.handleAutoPlanIntent(chatId, lastMessage.content, context);
        return;
      }

      // Check if this is a task creation request
      if (this.aiService.hasTaskCreationIntent(lastMessage.content)) {
        this.logger.log('Task creation intent detected, parsing task...');
        await this.handleTaskCreationIntent(chatId, lastMessage.content, context);
        return;
      }

      // Get chat to find organization ID for SEO tools access
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { organizationId: true },
      });

      // Generate AI response with full conversation context and SEO tools
      const aiResponse = await this.aiService.generateResponse(
        lastMessage.content,
        context,
        chat?.organizationId,
      );

      // Get AI model from config
      const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      // Save AI message to database
      const aiMessage = await this.chatService.createAIMessage(
        chatId,
        this.aiUserId,
        aiResponse,
        aiModel,
        context,
      );

      // Broadcast AI response to all clients in the room
      this.server.to(chatId).emit('receive_message', aiMessage);

      // Broadcast to all clients to refresh their chat lists
      this.logger.log('🤖 Broadcasting AI response and refresh_chat_list');
      this.server.emit('refresh_chat_list', {
        chatId: aiMessage.chatId,
        timestamp: new Date(),
      });

      this.logger.log(`AI message ${aiMessage.id} delivered to room ${chatId}`);
    } catch (error) {
      this.logger.error('Error generating AI response:', error);
    }
  }

  /**
   * Handle task creation intent - parse and send task preview
   */
  private async handleTaskCreationIntent(
    chatId: string,
    message: string,
    context: any,
  ) {
    try {
      // Get chat to find organization
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, isAI: true },
              },
            },
          },
        },
      });

      if (!chat) {
        this.logger.warn('Chat not found for task creation');
        return;
      }

      // Get projects for the organization
      const projects = await this.prisma.project.findMany({
        where: {
          organizationId: chat.organizationId,
          isDeleted: false,
        },
        select: { id: true, name: true },
      });

      // Get all organization users as potential assignees
      const orgUsers = await this.prisma.user.findMany({
        where: { organizationId: chat.organizationId },
        select: { id: true, name: true, isAI: true },
      });

      // Parse task from message
      const parseResult = await this.aiService.parseTaskFromMessage(
        message,
        context,
        orgUsers,
        projects,
      );

      if (!parseResult.isTaskRequest || !parseResult.task) {
        // Not a valid task request, generate normal response
        this.logger.log('Not a valid task request, generating normal response');
        const aiResponse = await this.aiService.generateResponse(message, context, chat.organizationId);
        const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

        const aiMessage = await this.chatService.createAIMessage(
          chatId,
          this.aiUserId!,
          aiResponse,
          aiModel,
          context,
        );

        this.server.to(chatId).emit('receive_message', aiMessage);
        this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });
        return;
      }

      // Resolve assignee ID from name
      let assigneeId: string | undefined;
      if (parseResult.task.assigneeName) {
        const assigneeName = parseResult.task.assigneeName.toLowerCase();

        // Check if "me" or self-reference - find the message author
        if (assigneeName === 'me' || assigneeName === 'myself' || assigneeName === 'мені' || assigneeName === 'мне') {
          // Find the human user who sent the message (last non-AI message author)
          const lastUserMessage = context.conversationHistory
            .filter((m: any) => m.role === 'user')
            .pop();

          if (lastUserMessage) {
            const author = orgUsers.find(
              u => u.name.toLowerCase() === lastUserMessage.authorName?.toLowerCase()
            );
            if (author) assigneeId = author.id;
          }
        } else {
          // Match by name
          const assignee = orgUsers.find(
            u => u.name.toLowerCase().includes(assigneeName) ||
                 assigneeName.includes(u.name.toLowerCase())
          );
          if (assignee) assigneeId = assignee.id;
        }
      }

      // Resolve project ID from name
      let projectId: string | undefined;
      if (parseResult.task.projectName) {
        const projectName = parseResult.task.projectName.toLowerCase();
        const project = projects.find(
          p => p.name.toLowerCase().includes(projectName) ||
               projectName.includes(p.name.toLowerCase())
        );
        if (project) projectId = project.id;
      }

      // Create task preview with resolved IDs
      const taskPreview = {
        type: 'task_preview',
        task: {
          title: parseResult.task.title,
          description: parseResult.task.description,
          assigneeId,
          assigneeName: parseResult.task.assigneeName,
          projectId,
          projectName: parseResult.task.projectName,
          dueDate: parseResult.task.dueDate,
          scheduledTime: parseResult.task.scheduledTime,
          priority: parseResult.task.priority || 'medium',
          estimatedTime: parseResult.task.estimatedTime,
          recurrenceRule: parseResult.task.recurrenceRule,
          organizationId: chat.organizationId,
        },
        status: 'pending', // Not created yet
      };

      this.logger.log('📋 taskPreview object:', JSON.stringify(taskPreview));

      // Generate preview message
      const previewMessage = this.aiService.generateTaskPreviewMessage(
        parseResult.task,
        message.match(/[а-яА-ЯіІїЇєЄ]/) ? 'uk' : 'en',
      );

      const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      // Save AI message with ONLY taskPreview in aiContext (not the full context - too large)
      const aiContextToSave = { taskPreview };
      this.logger.log('📋 Saving aiContext to DB:', JSON.stringify(aiContextToSave));

      const aiMessage = await this.chatService.createAIMessage(
        chatId,
        this.aiUserId!,
        previewMessage,
        aiModel,
        aiContextToSave,
      );

      this.logger.log('📋 Created AI message with id:', aiMessage.id);
      this.logger.log('📋 AI message aiContext from DB:', JSON.stringify(aiMessage.aiContext));

      // Broadcast AI response with task preview
      const messageWithPreview = {
        ...aiMessage,
        aiContext: aiContextToSave,
      };
      this.logger.log('📋 Emitting task preview message to room:', chatId);
      this.logger.log('📋 Message aiContext:', JSON.stringify(messageWithPreview.aiContext));
      this.server.to(chatId).emit('receive_message', messageWithPreview);

      this.logger.log('📋 Task preview sent to chat');
      this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });
    } catch (error) {
      this.logger.error('Error handling task creation intent:', error);
    }
  }

  /**
   * Handle auto-plan intent - generate and send plan preview
   */
  private async handleAutoPlanIntent(
    chatId: string,
    message: string,
    _context: any,
  ) {
    try {
      // Get chat to find organization and user
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, isAI: true },
              },
            },
          },
        },
      });

      if (!chat) {
        this.logger.warn('Chat not found for auto-plan');
        return;
      }

      // Find the human user who sent the message
      const humanMember = chat.members.find(m => !m.user.isAI);
      if (!humanMember) {
        this.logger.warn('No human user found in chat');
        return;
      }

      const userId = humanMember.userId;
      const userName = humanMember.user.name;

      this.logger.log(`📅 Generating auto-plan for user ${userName} (${userId})`);

      // Generate the plan using TaskService
      const planResult = await this.taskService.generateAutoPlan(
        chat.organizationId,
        userId,
      );

      this.logger.log(`📅 Plan generated: ${planResult.totalTasksPlanned} tasks planned`);

      // Detect language for response message
      const isUkrainian = message.match(/[а-яА-ЯіІїЇєЄ]/);

      // Create auto-plan preview
      const autoPlanPreview = {
        type: 'auto_plan_preview',
        plan: planResult.plan,
        weeks: planResult.weeks,
        summaryByDate: planResult.summaryByDate,
        planStart: planResult.planStart,
        planEnd: planResult.planEnd,
        totalTasksPlanned: planResult.totalTasksPlanned,
        totalTasksInBacklog: planResult.totalTasksInBacklog,
        unscheduledTasks: planResult.unscheduledTasks || [],
        status: 'pending', // Not applied yet
      };

      // Generate preview message based on plan result
      let previewMessage: string;

      if (planResult.totalTasksPlanned === 0) {
        previewMessage = isUkrainian
          ? '📅 У вас немає задач для планування. Додайте задачі до беклогу, щоб я міг їх розпланувати.'
          : '📅 You have no tasks to plan. Add tasks to your backlog so I can schedule them.';
      } else {
        const totalHours = Object.values(planResult.summaryByDate || {}).reduce(
          (sum: number, h) => sum + (h as number),
          0,
        );

        if (isUkrainian) {
          previewMessage = `📅 **План на ${planResult.weeks?.length || 0} тижні**\n\n`;
          previewMessage += `📋 Заплановано: **${planResult.totalTasksPlanned}** з ${planResult.totalTasksInBacklog} задач\n`;
          previewMessage += `⏱️ Загальний час: **${totalHours}** годин\n\n`;

          if (planResult.weeks) {
            for (const week of planResult.weeks) {
              previewMessage += `**${week.label}**\n`;
            }
          }

          if (planResult.unscheduledTasks && planResult.unscheduledTasks.length > 0) {
            previewMessage += `\n⚠️ ${planResult.unscheduledTasks.length} задач не вдалося запланувати`;
          }
        } else {
          previewMessage = `📅 **Plan for ${planResult.weeks?.length || 0} weeks**\n\n`;
          previewMessage += `📋 Scheduled: **${planResult.totalTasksPlanned}** of ${planResult.totalTasksInBacklog} tasks\n`;
          previewMessage += `⏱️ Total time: **${totalHours}** hours\n\n`;

          if (planResult.weeks) {
            for (const week of planResult.weeks) {
              previewMessage += `**${week.label}**\n`;
            }
          }

          if (planResult.unscheduledTasks && planResult.unscheduledTasks.length > 0) {
            previewMessage += `\n⚠️ ${planResult.unscheduledTasks.length} tasks could not be scheduled`;
          }
        }
      }

      const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      // Save AI message with auto-plan preview in aiContext
      const aiContextToSave = { autoPlanPreview };
      this.logger.log('📅 Saving aiContext to DB:', JSON.stringify(aiContextToSave));

      const aiMessage = await this.chatService.createAIMessage(
        chatId,
        this.aiUserId!,
        previewMessage,
        aiModel,
        aiContextToSave,
      );

      this.logger.log('📅 Created AI message with id:', aiMessage.id);

      // Broadcast AI response with auto-plan preview
      const messageWithPreview = {
        ...aiMessage,
        aiContext: aiContextToSave,
      };

      this.server.to(chatId).emit('receive_message', messageWithPreview);
      this.logger.log('📅 Auto-plan preview sent to chat');
      this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });
    } catch (error) {
      this.logger.error('Error handling auto-plan intent:', error);
    }
  }

  @SubscribeMessage('confirm_auto_plan_applied')
  async handleAutoPlanApplied(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    payload: {
      chatId: string;
      messageId?: string;
      tasksApplied: number;
    },
  ) {
    const { chatId, messageId, tasksApplied } = payload;

    if (!this.aiUserId) {
      this.logger.warn('AI user not available for auto-plan confirmation');
      return;
    }

    try {
      // Update the original message to mark auto-plan as applied
      if (messageId) {
        const originalMessage = await this.prisma.message.findUnique({
          where: { id: messageId },
        });

        if (originalMessage?.aiContext) {
          const aiContext = originalMessage.aiContext as any;
          if (aiContext.autoPlanPreview) {
            const updatedAiContext = {
              ...aiContext,
              autoPlanPreview: {
                ...aiContext.autoPlanPreview,
                status: 'applied',
              },
            };

            await this.prisma.message.update({
              where: { id: messageId },
              data: { aiContext: updatedAiContext },
            });

            this.logger.log(`📅 Updated message ${messageId} autoPlanPreview status to 'applied'`);
          }
        }
      }

      // Generate confirmation message
      const confirmationMessage = `✅ План застосовано!\n\n📋 **${tasksApplied}** задач заплановано на найближчі тижні.\n\nПерегляньте календар задач, щоб побачити розклад.`;

      const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      const aiMessage = await this.chatService.createAIMessage(
        chatId,
        this.aiUserId,
        confirmationMessage,
        aiModel,
        {},
      );

      this.server.to(chatId).emit('receive_message', aiMessage);
      this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });

      this.logger.log('✅ Auto-plan confirmation sent');
    } catch (error) {
      this.logger.error('Error sending auto-plan confirmation:', error);
    }
  }

  // ==========================================
  // Message Reactions
  // ==========================================

  @SubscribeMessage('add_reaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; userId: string; emoji: string; chatId: string },
  ) {
    this.logger.log(`🎯 add_reaction received: ${JSON.stringify(payload)}`);

    try {
      if (!payload?.messageId || !payload?.userId || !payload?.emoji || !payload?.chatId) {
        this.logger.error('Invalid payload for add_reaction:', payload);
        client.emit('error', {
          message: 'Invalid payload: messageId, userId, emoji, and chatId are required',
          code: 'INVALID_PAYLOAD',
        });
        return { success: false };
      }

      // Verify user is a member of this chat
      const isMember = await this.chatService.isChatMember(payload.chatId, payload.userId);
      if (!isMember) {
        this.logger.warn(`User ${payload.userId} not authorized for chat ${payload.chatId}`);
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this chat',
        });
        return { success: false };
      }

      const reaction = await this.chatService.addReaction(
        payload.messageId,
        payload.userId,
        payload.emoji,
      );

      this.logger.log(`✅ Reaction created: ${reaction.id}, emoji: ${payload.emoji}`);

      // Broadcast to all in room
      this.server.to(payload.chatId).emit('reaction_added', {
        messageId: payload.messageId,
        reaction: {
          id: reaction.id,
          emoji: reaction.emoji,
          userId: payload.userId,
          user: reaction.user,
        },
      });

      this.logger.log(`📡 Broadcast reaction_added to room ${payload.chatId}`);
      return { success: true, reaction };
    } catch (error) {
      this.logger.error('Error adding reaction:', error);
      client.emit('error', {
        message: 'Failed to add reaction',
        code: 'REACTION_FAILED',
      });
      return { success: false };
    }
  }

  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; userId: string; emoji: string; chatId: string },
  ) {
    this.logger.log(`🎯 remove_reaction received: ${JSON.stringify(payload)}`);

    try {
      if (!payload?.messageId || !payload?.userId || !payload?.emoji || !payload?.chatId) {
        this.logger.error('Invalid payload for remove_reaction:', payload);
        client.emit('error', {
          message: 'Invalid payload',
          code: 'INVALID_PAYLOAD',
        });
        return { success: false };
      }

      // Verify user is a member of this chat
      const isMember = await this.chatService.isChatMember(payload.chatId, payload.userId);
      if (!isMember) {
        this.logger.warn(`User ${payload.userId} not authorized for chat ${payload.chatId}`);
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this chat',
        });
        return { success: false };
      }

      await this.chatService.removeReaction(
        payload.messageId,
        payload.userId,
        payload.emoji,
      );

      this.logger.log(`✅ Reaction removed: ${payload.emoji} from message ${payload.messageId}`);

      // Broadcast to all in room
      this.server.to(payload.chatId).emit('reaction_removed', {
        messageId: payload.messageId,
        userId: payload.userId,
        emoji: payload.emoji,
      });

      this.logger.log(`📡 Broadcast reaction_removed to room ${payload.chatId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error removing reaction:', error);
      client.emit('error', {
        message: 'Failed to remove reaction',
        code: 'REACTION_FAILED',
      });
      return { success: false };
    }
  }

  // ==========================================
  // Message Edit and Delete
  // ==========================================

  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; userId: string; content: string; chatId: string },
  ) {
    try {
      if (!payload?.messageId || !payload?.userId || !payload?.content || !payload?.chatId) {
        client.emit('error', {
          message: 'Invalid payload: messageId, userId, content, and chatId are required',
          code: 'INVALID_PAYLOAD',
        });
        return { success: false };
      }

      // Verify user is a member of this chat
      const isMember = await this.chatService.isChatMember(payload.chatId, payload.userId);
      if (!isMember) {
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this chat',
        });
        return { success: false };
      }

      const updatedMessage = await this.chatService.editMessage(
        payload.messageId,
        payload.userId,
        payload.content,
      );

      // Broadcast to all in room
      this.server.to(payload.chatId).emit('message_edited', {
        messageId: payload.messageId,
        content: updatedMessage.content,
        editedAt: updatedMessage.editedAt,
      });

      this.logger.log(`Message ${payload.messageId} edited`);
      return { success: true, message: updatedMessage };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit message';
      this.logger.error('Error editing message:', error);
      client.emit('error', {
        message: errorMessage,
        code: 'EDIT_FAILED',
      });
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; userId: string; chatId: string },
  ) {
    try {
      if (!payload?.messageId || !payload?.userId || !payload?.chatId) {
        client.emit('error', {
          message: 'Invalid payload: messageId, userId, and chatId are required',
          code: 'INVALID_PAYLOAD',
        });
        return { success: false };
      }

      // Verify user is a member of this chat
      const isMember = await this.chatService.isChatMember(payload.chatId, payload.userId);
      if (!isMember) {
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this chat',
        });
        return { success: false };
      }

      const deletedMessage = await this.chatService.softDeleteMessage(
        payload.messageId,
        payload.userId,
      );

      // Broadcast to all in room
      this.server.to(payload.chatId).emit('message_deleted', {
        messageId: payload.messageId,
        deletedAt: deletedMessage.deletedAt,
      });

      this.logger.log(`Message ${payload.messageId} deleted`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      this.logger.error('Error deleting message:', error);
      client.emit('error', {
        message: errorMessage,
        code: 'DELETE_FAILED',
      });
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('confirm_task_created')
  async handleTaskCreatedConfirmation(
    @ConnectedSocket() _client: Socket,
    @MessageBody()
    payload: {
      chatId: string;
      messageId?: string; // The message with task preview to update
      taskId?: string; // The created task ID
      taskTitle: string;
      assigneeName?: string;
      taskCount?: number;
      isGroupTask?: boolean;
    },
  ) {
    const { chatId, messageId, taskId, taskTitle, assigneeName, taskCount, isGroupTask } = payload;

    if (!this.aiUserId) {
      this.logger.warn('AI user not available for task confirmation');
      return;
    }

    try {
      // Update the original message to mark task preview as created
      if (messageId) {
        const originalMessage = await this.prisma.message.findUnique({
          where: { id: messageId },
        });

        if (originalMessage?.aiContext) {
          const aiContext = originalMessage.aiContext as any;
          if (aiContext.taskPreview) {
            // Update the task preview status to 'created' and add taskId
            const updatedAiContext = {
              ...aiContext,
              taskPreview: {
                ...aiContext.taskPreview,
                status: 'created',
                taskId: taskId,
              },
            };

            await this.prisma.message.update({
              where: { id: messageId },
              data: { aiContext: updatedAiContext },
            });

            this.logger.log(`📋 Updated message ${messageId} taskPreview status to 'created'`);
          }
        }
      }

      // Generate confirmation message
      let confirmationMessage: string;

      if (isGroupTask && taskCount && taskCount > 1) {
        confirmationMessage = `✅ Створено ${taskCount} задач для всіх учасників команди!\n\n📋 **${taskTitle}**\n\nКожен учасник отримає це завдання і повинен буде підтвердити участь.`;
      } else if (assigneeName) {
        confirmationMessage = `✅ Задачу створено!\n\n📋 **${taskTitle}**\n👤 Призначено: ${assigneeName}\n\nЗавдання очікує підтвердження від виконавця.`;
      } else {
        confirmationMessage = `✅ Задачу створено!\n\n📋 **${taskTitle}**\n\nЗавдання додано до беклогу.`;
      }

      const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      // Create AI confirmation message
      const aiMessage = await this.chatService.createAIMessage(
        chatId,
        this.aiUserId,
        confirmationMessage,
        aiModel,
        {},
      );

      // Broadcast to chat
      this.server.to(chatId).emit('receive_message', aiMessage);
      this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });

      this.logger.log('✅ Task creation confirmation sent');
    } catch (error) {
      this.logger.error('Error sending task confirmation:', error);
    }
  }
}
