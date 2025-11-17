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

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Find and remove user from online list
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        
        // Notify others that user went offline
        this.server.emit('user_status', {
          userId,
          status: 'offline',
        });
        
        this.logger.log(`User ${userId} went offline`);
        break;
      }
    }
  }

  @SubscribeMessage('user_online')
  handleUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; organizationId: string },
  ) {
    this.logger.log(`User ${payload.userId} is online`);
    
    // Store user as online
    this.onlineUsers.set(payload.userId, client.id);
    
    // Join organization room
    client.join(`org:${payload.organizationId}`);
    
    // Notify others in organization
    client.to(`org:${payload.organizationId}`).emit('user_status', {
      userId: payload.userId,
      status: 'online',
    });
    
    // Send list of currently online users to the new user
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    client.emit('online_users', onlineUserIds);
    
    return { status: 'online', onlineUsers: onlineUserIds };
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
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string; authorId: string; content: string },
  ) {
    this.logger.log(`Message from ${client.id}: ${payload.content}`);
    
    // Create fake message object
    const message = {
      id: Date.now().toString(),
      content: payload.content,
      author: {
        id: payload.authorId,
        name: 'User',
      },
      createdAt: new Date().toISOString(),
    };

    // Broadcast to room
    this.server.to(payload.chatId).emit('receive_message', message);
    
    return message;
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

  // Helper method to get online users (for API endpoint if needed)
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}