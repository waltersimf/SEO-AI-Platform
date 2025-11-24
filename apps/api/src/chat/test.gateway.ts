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

  constructor() {}

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

  @SubscribeMessage('join_organization')
  handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() organizationId: string,
  ) {
    const roomName = `org:${organizationId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined organization room ${roomName}`);
    return { event: 'joined_organization', data: organizationId };
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