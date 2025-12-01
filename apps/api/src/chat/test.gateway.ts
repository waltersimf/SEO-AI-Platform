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
import { PrismaService } from '../prisma/prisma.service';

interface OnlineUserInfo {
  socketId: string;
  organizationId: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class TestGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('TestGateway');

  // Track online users: userId → { socketId, organizationId }
  private onlineUsers = new Map<string, OnlineUserInfo>();

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Find and remove user from online list
    for (const [userId, userInfo] of this.onlineUsers.entries()) {
      if (userInfo.socketId === client.id) {
        const orgId = userInfo.organizationId;
        this.onlineUsers.delete(userId);
        this.logger.log(`User ${userId} went offline`);

        // Broadcast updated online users list to the user's organization only
        this.broadcastOnlineUsers(orgId);
        break;
      }
    }
  }

  @SubscribeMessage('user_online')
  handleUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; organizationId: string },
  ) {
    this.logger.log(`User ${payload.userId} is now online in org ${payload.organizationId}`);

    // Store user as online with organization info
    this.onlineUsers.set(payload.userId, {
      socketId: client.id,
      organizationId: payload.organizationId,
    });

    // Join organization room
    const roomName = `org_${payload.organizationId}`;
    client.join(roomName);

    // Broadcast updated online users list to the user's organization only
    this.broadcastOnlineUsers(payload.organizationId);

    // Return only users from the same organization
    const orgOnlineUsers = this.getOrganizationOnlineUsers(payload.organizationId);

    return {
      status: 'success',
      onlineUsers: orgOnlineUsers,
    };
  }

  @SubscribeMessage('join_organization')
  async handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; organizationId: string },
  ) {
    // Handle both old format (just string) and new format (object with userId and organizationId)
    const organizationId = typeof payload === 'string' ? payload : payload?.organizationId;
    const userId = typeof payload === 'string' ? null : payload?.userId;

    if (!organizationId) {
      client.emit('error', {
        code: 'INVALID_PAYLOAD',
        message: 'Organization ID is required',
      });
      return { success: false, error: 'Organization ID is required' };
    }

    // Security: Verify user belongs to this organization if userId is provided
    if (userId) {
      try {
        const user = await this.prisma.user.findFirst({
          where: {
            id: userId,
            organizationId: organizationId,
          },
        });

        if (!user) {
          this.logger.warn(
            `Unauthorized organization join attempt: userId=${userId}, orgId=${organizationId}`,
          );
          client.emit('error', {
            code: 'UNAUTHORIZED',
            message: 'Not authorized for this organization',
          });
          return { success: false, error: 'Not authorized for this organization' };
        }
      } catch (error) {
        this.logger.error(
          `Error verifying organization membership: userId=${userId}, orgId=${organizationId}`,
          error,
        );
        client.emit('error', {
          code: 'JOIN_ORG_FAILED',
          message: 'Failed to join organization room',
        });
        return { success: false, error: 'Failed to join organization room' };
      }
    }

    const roomName = `org_${organizationId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined organization room ${roomName}`);
    return { event: 'joined_organization', data: organizationId };
  }

  /**
   * Get online users for a specific organization
   */
  private getOrganizationOnlineUsers(organizationId: string): string[] {
    const orgUsers: string[] = [];
    for (const [userId, userInfo] of this.onlineUsers.entries()) {
      if (userInfo.organizationId === organizationId) {
        orgUsers.push(userId);
      }
    }
    return orgUsers;
  }

  /**
   * Broadcast updated list of online users to organization room only
   */
  private broadcastOnlineUsers(organizationId: string) {
    const orgOnlineUsers = this.getOrganizationOnlineUsers(organizationId);

    // Emit only to the organization room
    this.server.to(`org_${organizationId}`).emit('online_users_updated', orgOnlineUsers);

    this.logger.log(
      `Broadcasting online users to org ${organizationId}: ${orgOnlineUsers.length} online`,
    );
  }

  /**
   * Get list of currently online users for a specific organization
   */
  getOnlineUsers(organizationId?: string): string[] {
    if (organizationId) {
      return this.getOrganizationOnlineUsers(organizationId);
    }
    return Array.from(this.onlineUsers.keys());
  }
}