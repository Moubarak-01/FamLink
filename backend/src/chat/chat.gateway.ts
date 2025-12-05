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

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: { roomId: string, message: { senderId: string, text: string, mac: string, replyTo?: string } }, @ConnectedSocket() client: Socket) {
    const { senderId, text, mac, replyTo } = data.message;
    
    const savedMessage = await this.chatService.saveMessage(data.roomId, senderId, text, mac, replyTo);
    
    let initialStatus = 'sent';
    const receiverIdStr = savedMessage.receiverId ? savedMessage.receiverId.toString() : null;

    if (receiverIdStr && this.connectedUsers.has(receiverIdStr)) {
        // Default to delivered since they are connected
        initialStatus = 'delivered';
        savedMessage.deliveredAt = new Date();

        // FIX: Check if the recipient is actually INSIDE the room right now
        const roomSockets = this.server.sockets.adapter.rooms.get(data.roomId);
        const recipientSockets = this.connectedUsers.get(receiverIdStr) || [];
        
        // If any of the recipient's sockets are in the room, mark as seen immediately
        const isRecipientInRoom = recipientSockets.some(socketId => roomSockets?.has(socketId));
        
        if (isRecipientInRoom) {
            initialStatus = 'seen';
            savedMessage.seenAt = new Date();
        }

        savedMessage.status = initialStatus;
        await savedMessage.save();
    }

    await savedMessage.populate('senderId', 'fullName photo');

    const payload = {
      id: savedMessage._id.toString(),
      text: savedMessage.text,
      mac: savedMessage.mac,
      senderId: savedMessage.senderId['_id'].toString(),
      senderName: savedMessage.senderId['fullName'],
      senderPhoto: savedMessage.senderId['photo'],
      timestamp: savedMessage['createdAt'],
      status: initialStatus,
      reactions: [],
      replyTo: savedMessage.replyTo,
      deleted: false
    };

    client.to(data.roomId).emit('receive_message', { roomId: data.roomId, message: payload });

    // UPDATE: Always create notification for the receiver, regardless of connection status
    if (receiverIdStr) {
        await this.notificationsService.create(
            receiverIdStr,
            `New message from ${payload.senderName}`,
            'chat',
            data.roomId
        );
    }

    return payload;
  }

  @SubscribeMessage('add_reaction')
  async handleAddReaction(@MessageBody() data: { roomId: string, messageId: string, userId: string, emoji: string }) {
      await this.chatService.addReaction(data.messageId, data.userId, data.emoji);
      this.server.to(data.roomId).emit('reaction_added', data);
  }

  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(@MessageBody() data: { roomId: string, messageId: string, userId: string, emoji: string }) {
      await this.chatService.removeReaction(data.messageId, data.userId, data.emoji);
      this.server.to(data.roomId).emit('reaction_removed', data);
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(@MessageBody() data: { roomId: string, messageId: string }) {
      await this.chatService.deleteMessage(data.messageId);
      this.server.to(data.roomId).emit('message_deleted', { roomId: data.roomId, messageId: data.messageId });
  }

  @SubscribeMessage('clear_chat')
  async handleClearChat(@MessageBody() data: { roomId: string }) {
      await this.chatService.deleteAllMessages(data.roomId);
      this.server.to(data.roomId).emit('chat_cleared', { roomId: data.roomId });
  }

  @SubscribeMessage('check_online')
  handleCheckOnline(@MessageBody() userId: string): boolean {
      return this.connectedUsers.has(userId);
  }
}