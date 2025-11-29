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

interface ConnectedClient {
  socketId: string;
  userId?: string;
  userName?: string;
  connectedAt: Date;
  reconnectAttempts: number;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
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
  handleJoinRoom(
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

      // Notify others in the room
      client.to(payload.chatId).emit('user_joined', {
        userId: payload.userId,
        userName: payload.userName,
        joinedAt: new Date().toISOString(),
      });

      return { success: true, event: 'joined_room', data: payload.chatId };
    } catch (error) {
      this.logger.error(`Error joining room for ${client.id}:`, error);
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
        `Error handling message from ${client.id}:`,
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
      this.logger.error(`Error in typing_start for ${client.id}:`, error);
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
      this.logger.error(`Error in typing_stop for ${client.id}:`, error);
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
      this.logger.error(`Error in reconnect_attempt for ${client.id}:`, error);
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

      // Check if this is a task creation request
      if (this.aiService.hasTaskCreationIntent(lastMessage.content)) {
        this.logger.log('Task creation intent detected, parsing task...');
        await this.handleTaskCreationIntent(chatId, lastMessage.content, context);
        return;
      }

      // Generate AI response with full conversation context
      const aiResponse = await this.aiService.generateResponse(lastMessage.content, context);

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
        const aiResponse = await this.aiService.generateResponse(message, context);
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
          priority: parseResult.task.priority || 'medium',
          estimatedTime: parseResult.task.estimatedTime,
          organizationId: chat.organizationId,
        },
        status: 'pending', // Not created yet
      };

      // Generate preview message
      const previewMessage = this.aiService.generateTaskPreviewMessage(
        parseResult.task,
        message.match(/[а-яА-ЯіІїЇєЄ]/) ? 'uk' : 'en',
      );

      const aiModel = this.configService.get<string>('AI_MODEL') || 'claude-sonnet-4-20250514';

      // Save AI message with task preview in aiContext
      const aiMessage = await this.chatService.createAIMessage(
        chatId,
        this.aiUserId!,
        previewMessage,
        aiModel,
        { ...context, taskPreview },
      );

      // Broadcast AI response with task preview
      this.server.to(chatId).emit('receive_message', {
        ...aiMessage,
        aiContext: { taskPreview },
      });

      this.logger.log('📋 Task preview sent to chat');
      this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });
    } catch (error) {
      this.logger.error('Error handling task creation intent:', error);
    }
  }

  @SubscribeMessage('confirm_task_created')
  async handleTaskCreatedConfirmation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      chatId: string;
      taskTitle: string;
      assigneeName?: string;
      taskCount?: number;
      isGroupTask?: boolean;
    },
  ) {
    const { chatId, taskTitle, assigneeName, taskCount, isGroupTask } = payload;

    if (!this.aiUserId) {
      this.logger.warn('AI user not available for task confirmation');
      return;
    }

    try {
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