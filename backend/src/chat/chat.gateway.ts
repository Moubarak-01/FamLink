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

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users: Map<UserId, SocketId[]>
  private connectedUsers = new Map<string, string[]>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 1. USER COMES ONLINE ( Triggers DELIVERED status )
  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      // Add to tracker
      const sockets = this.connectedUsers.get(userId) || [];
      sockets.push(client.id);
      this.connectedUsers.set(userId, sockets);
      
      client.join(`user_${userId}`);
      console.log(`🟢 User ${userId} connected.`);

      // CORE LOGIC: Bulk update pending messages to 'delivered'
      const updatedMessages = await this.chatService.markUndeliveredMessagesAsDelivered(userId);
      
      // Notify the SENDERS that their messages are now delivered
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
        } else {
            this.connectedUsers.set(userId, sockets);
        }
    }
  }

  // 2. USER OPENS CHAT ( Triggers SEEN status )
  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() data: { roomId: string, userId?: string }, @ConnectedSocket() client: Socket) {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const userId = typeof data === 'object' ? data.userId : null;

    client.join(roomId);

    if (userId) {
       // Mark messages in this room as seen
       await this.chatService.markMessagesAsSeen(roomId, userId);
       
       // Broadcast 'seen' to the sender(s) in the room
       this.server.to(roomId).emit('messages_status_update', { 
           roomId, 
           status: 'seen', 
           userId // Who saw it
       });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
  }

  // 3. SEND MESSAGE ( Triggers SENT status, checks for immediate DELIVERED )
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: { senderId: string; text: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const savedMessage = await this.chatService.saveMessage(
      data.roomId,
      data.message.senderId,
      data.message.text,
    );

    await savedMessage.populate('senderId', 'fullName photo');
    
    // Check if receiver is currently online
    let initialStatus = 'sent';
    if (savedMessage.receiverId && this.connectedUsers.has(savedMessage.receiverId.toString())) {
        savedMessage.status = 'delivered';
        savedMessage.deliveredAt = new Date();
        await savedMessage.save();
        initialStatus = 'delivered';
    }

    const messagePayload = {
      id: savedMessage._id.toString(),
      text: savedMessage.text,
      senderId: savedMessage.senderId['_id'].toString(),
      senderName: savedMessage.senderId['fullName'],
      senderPhoto: savedMessage.senderId['photo'],
      timestamp: savedMessage['createdAt'],
      status: initialStatus
    };

    // Send to Recipient
    client.to(data.roomId).emit('receive_message', {
      roomId: data.roomId,
      message: messagePayload,
    });

    // Send Notification if not in room
    this.notificationsService.create(savedMessage.receiverId, `New message`, 'chat', data.roomId);

    return messagePayload; // Returns to Sender
  }
}