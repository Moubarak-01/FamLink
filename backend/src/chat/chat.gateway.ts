import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string[]>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const sockets = this.connectedUsers.get(userId) || [];
      sockets.push(client.id);
      this.connectedUsers.set(userId, sockets);
      
      client.join(`user_${userId}`);
      this.server.emit('user_presence', { userId, status: 'online' });

      const updatedMessages = await this.chatService.markUndeliveredMessagesAsDelivered(userId);
      updatedMessages.forEach(msg => {
          this.server.to(`user_${msg.senderId}`).emit('message_status_update', {
              messageId: msg._id.toString(),
              roomId: msg.roomId,
              status: 'delivered'
          });
      });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId && this.connectedUsers.has(userId)) {
        const sockets = this.connectedUsers.get(userId).filter(id => id !== client.id);
        if (sockets.length === 0) {
            this.connectedUsers.delete(userId);
            this.server.emit('user_presence', { userId, status: 'offline' });
        } else {
            this.connectedUsers.set(userId, sockets);
        }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() payload: { roomId: string, userId: string }, @ConnectedSocket() client: Socket) {
    client.join(payload.roomId);
    const updatedIds = await this.chatService.markMessagesAsSeen(payload.roomId, payload.userId);
    
    if (updatedIds.length > 0) {
         this.server.to(payload.roomId).emit('messages_status_update', { 
            roomId: payload.roomId, 
            status: 'seen', 
            userId: payload.userId 
        });
    }
  }

  @SubscribeMessage('check_online')
  handleCheckOnline(@MessageBody() userId: string): boolean {
      return this.connectedUsers.has(userId);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: { roomId: string, message: { senderId: string, text: string, mac: string } }, @ConnectedSocket() client: Socket) {
    // UPDATE 1: Pulled text (ciphertext) and mac from data.message
    const { senderId, text, mac } = data.message;
    
    // UPDATE 2: Passed mac to saveMessage
    const savedMessage = await this.chatService.saveMessage(data.roomId, senderId, text, mac);
    
    let initialStatus = 'sent';
    const receiverIdStr = savedMessage.receiverId ? savedMessage.receiverId.toString() : null;

    if (receiverIdStr && this.connectedUsers.has(receiverIdStr)) {
        savedMessage.status = 'delivered';
        savedMessage.deliveredAt = new Date();
        await savedMessage.save();
        initialStatus = 'delivered';
    }

    await savedMessage.populate('senderId', 'fullName photo');

    const payload = {
      id: savedMessage._id.toString(),
      text: savedMessage.text,
      mac: savedMessage.mac, // UPDATE 3: Included mac in the outgoing payload
      senderId: savedMessage.senderId['_id'].toString(),
      senderName: savedMessage.senderId['fullName'],
      senderPhoto: savedMessage.senderId['photo'],
      timestamp: savedMessage['createdAt'],
      status: initialStatus
    };

    if (receiverIdStr) {
        this.server.to(`user_${receiverIdStr}`).emit('receive_message', { roomId: data.roomId, message: payload });
        await this.notificationsService.create(
            receiverIdStr,
            `New message from ${payload.senderName}`,
            'chat',
            data.roomId
        );
    }
    
    client.to(data.roomId).emit('receive_message', { roomId: data.roomId, message: payload });

    return payload;
  }
}