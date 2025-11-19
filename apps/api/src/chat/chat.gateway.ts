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
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

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

  constructor(private chatService: ChatService) {}

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
}