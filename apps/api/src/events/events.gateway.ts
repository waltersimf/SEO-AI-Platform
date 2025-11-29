import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface OrganizationRoom {
  organizationId: string;
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  // Track which users are in which organization rooms
  private userOrganizations: Map<string, string> = new Map();

  @SubscribeMessage('join_organization')
  handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: OrganizationRoom,
  ) {
    if (!payload?.organizationId || !payload?.userId) {
      return { success: false, error: 'organizationId and userId required' };
    }

    const roomName = `org:${payload.organizationId}`;
    client.join(roomName);
    this.userOrganizations.set(client.id, payload.organizationId);

    this.logger.log(
      `User ${payload.userId} joined organization room ${roomName}`,
    );

    return { success: true, room: roomName };
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
}
