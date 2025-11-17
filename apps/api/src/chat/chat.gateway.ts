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

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private chatService: ChatService) {}

  afterInit(_server: Server) {
  this.logger.log('WebSocket Gateway initialized');
}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
    @MessageBody() payload: CreateMessageDto,
  ) {
    try {
      this.logger.log(`Message from ${client.id}: ${payload.content}`);

      // Зберігаємо в БД
      const message = await this.chatService.createMessage(
        payload.chatId,
        payload.authorId,
        payload.content,
      );

      // Broadcast до всіх в room
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
}