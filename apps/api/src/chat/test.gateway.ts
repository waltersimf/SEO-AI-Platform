import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class TestGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('TestGateway');
  
  // Track online users: userId → socketId
  private onlineUsers = new Map<string, string>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Find and remove user from online list
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        this.logger.log(`User ${userId} went offline`);
        
        // Broadcast updated online users list to ALL clients
        this.broadcastOnlineUsers();
        break;
      }
    }
  }

  @SubscribeMessage('user_online')
  handleUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; organizationId: string },
  ) {
    this.logger.log(`User ${payload.userId} is now online`);
    
    // Store user as online
    this.onlineUsers.set(payload.userId, client.id);
    
    // Join organization room (for future features)
    client.join(`org:${payload.organizationId}`);
    
    // Broadcast updated online users list to ALL clients
    this.broadcastOnlineUsers();
    
    return { 
      status: 'success', 
      onlineUsers: Array.from(this.onlineUsers.keys()) 
    };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string,
  ) {
    client.join(chatId);
    this.logger.log(`Client ${client.id} joined room ${chatId}`);
    return { event: 'joined_room', data: chatId };
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; authorId: string; content: string },
  ) {
    try {
      this.logger.log(`Message from ${client.id}: ${payload.content}`);

      // Save to database using ChatService
      const message = await this.chatService.createMessage(
        payload.chatId,
        payload.authorId,
        payload.content,
      );

      // Broadcast to room with REAL author name from DB
      this.server.to(payload.chatId).emit('receive_message', message);
      
      return message;
    } catch (error) {
      this.logger.error('Error handling message:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; userId: string; userName: string },
  ) {
    client.to(payload.chatId).emit('user_typing', {
      userId: payload.userId,
      userName: payload.userName,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; userId: string },
  ) {
    client.to(payload.chatId).emit('user_typing', {
      userId: payload.userId,
      isTyping: false,
    });
  }

  /**
   * Broadcast updated list of online users to ALL connected clients
   */
  private broadcastOnlineUsers() {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    
    // Emit to ALL clients
    this.server.emit('online_users_updated', onlineUserIds);
    
    this.logger.log(`Broadcasting online users: ${onlineUserIds.length} online`);
  }

  /**
   * Get list of currently online users (for API endpoint if needed)
   */
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}