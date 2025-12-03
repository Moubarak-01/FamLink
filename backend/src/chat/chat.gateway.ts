
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('join_room')
  handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
    console.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: { senderId: string; text: string, id?: string } },
    @ConnectedSocket() client: Socket,
  ) {
    // Save to DB
    const savedMessage = await this.chatService.saveMessage(
      data.roomId,
      data.message.senderId,
      data.message.text,
    );

    // Broadcast to everyone in room except sender
    client.to(data.roomId).emit('receive_message', {
      roomId: data.roomId,
      message: {
        id: savedMessage._id.toString(),
        text: savedMessage.text,
        senderId: savedMessage.senderId,
        timestamp: savedMessage['createdAt'], // Mongoose timestamps
        // In a real app, you might want to fetch sender info to broadcast, or rely on frontend state
      },
    });
  }
}
