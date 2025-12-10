import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface OrganizationRoom {
  organizationId: string;
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  // Track which users are in which organization rooms
  private userOrganizations: Map<string, string> = new Map();

  constructor(private prisma: PrismaService) {}

  @SubscribeMessage('join_organization')
  async handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: OrganizationRoom,
  ) {
    if (!payload?.organizationId || !payload?.userId) {
      return { success: false, error: 'organizationId and userId required' };
    }

    try {
      // Security: Verify user belongs to this organization
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.userId,
          organizationId: payload.organizationId,
        },
      });

      if (!user) {
        this.logger.warn(
          `Unauthorized organization join attempt: userId=${payload.userId}, orgId=${payload.organizationId}`,
        );
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Not authorized for this organization',
        });
        return { success: false, error: 'Not authorized for this organization' };
      }

      const roomName = `org:${payload.organizationId}`;
      client.join(roomName);
      this.userOrganizations.set(client.id, payload.organizationId);

      this.logger.log(
        `User ${payload.userId} joined organization room ${roomName}`,
      );

      return { success: true, room: roomName };
    } catch (error) {
      this.logger.error(
        `Error joining organization: userId=${payload.userId}, orgId=${payload.organizationId}`,
        error,
      );
      client.emit('error', {
        code: 'JOIN_ORG_FAILED',
        message: 'Failed to join organization room',
      });
      return { success: false, error: 'Failed to join organization room' };
    }
  }

  // Emit task created event to organization
  emitTaskCreated(organizationId: string, task: any) {
    const roomName = `org:${organizationId}`;
    this.logger.log(`Emitting task_created to room ${roomName}`);
    this.server.to(roomName).emit('task_created', task);
  }

  // Emit task updated event to organization
  emitTaskUpdated(organizationId: string, task: any) {
    const roomName = `org:${organizationId}`;
    this.logger.log(`Emitting task_updated to room ${roomName}`);
    this.server.to(roomName).emit('task_updated', task);
  }

  // Emit task deleted event to organization
  emitTaskDeleted(organizationId: string, taskId: string) {
    const roomName = `org:${organizationId}`;
    this.logger.log(`Emitting task_deleted to room ${roomName}`);
    this.server.to(roomName).emit('task_deleted', { taskId });
  }

  // Emit task status changed (for acceptance workflow)
  emitTaskStatusChanged(organizationId: string, task: any) {
    const roomName = `org:${organizationId}`;
    this.logger.log(`Emitting task_status_changed to room ${roomName}`);
    this.server.to(roomName).emit('task_status_changed', task);
  }

  // Emit bulk tasks updated (for auto-plan)
  emitTasksUpdated(organizationId: string) {
    const roomName = `org:${organizationId}`;
    this.logger.log(`Emitting tasks_updated to room ${roomName}`);
    this.server.to(roomName).emit('tasks_updated', { timestamp: new Date() });
  }

  // Emit chat list refresh
  emitChatListRefresh(chatId: string) {
    this.logger.log(`Emitting refresh_chat_list for chat ${chatId}`);
    this.server.emit('refresh_chat_list', { chatId, timestamp: new Date() });
  }
}
