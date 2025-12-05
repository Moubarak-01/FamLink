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
      
      // Update DB status to Online
      await this.chatService.updateUserStatus(userId, 'online');
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

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId && this.connectedUsers.has(userId)) {
        const sockets = this.connectedUsers.get(userId).filter(id => id !== client.id);
        if (sockets.length === 0) {
            this.connectedUsers.delete(userId);
            
            // Update DB status to Offline + LastSeen
            const updatedUser = await this.chatService.updateUserStatus(userId, 'offline');
            this.server.emit('user_presence', { 
                userId, 
                status: 'offline',
                lastSeen: updatedUser.lastSeen // Broadcast last seen time
            });
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

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { roomId: string, userId: string, userName: string }, @ConnectedSocket() client: Socket) {
      client.to(data.roomId).emit('user_typing', data);
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(@MessageBody() data: { roomId: string, userId: string }, @ConnectedSocket() client: Socket) {
      client.to(data.roomId).emit('user_stop_typing', data);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: { roomId: string, message: { senderId: string, text: string, mac: string, replyTo?: string } }, @ConnectedSocket() client: Socket) {
    const { senderId, text, mac, replyTo } = data.message;
    const savedMessage = await this.chatService.saveMessage(data.roomId, senderId, text, mac, replyTo);
    
    let initialStatus = 'sent';
    const receiverIdStr = savedMessage.receiverId ? savedMessage.receiverId.toString() : null;

    if (receiverIdStr && this.connectedUsers.has(receiverIdStr)) {
        initialStatus = 'delivered';
        savedMessage.deliveredAt = new Date();

        // Check if recipient is in the room
        const roomSockets = this.server.sockets.adapter.rooms.get(data.roomId);
        const recipientSockets = this.connectedUsers.get(receiverIdStr) || [];
        if (recipientSockets.some(socketId => roomSockets?.has(socketId))) {
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
      deleted: false,
      deletedFor: []
    };

    client.to(data.roomId).emit('receive_message', { roomId: data.roomId, message: payload });

    if (receiverIdStr) {
        await this.notificationsService.create(receiverIdStr, `New message from ${payload.senderName}`, 'chat', data.roomId);
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
  async handleDeleteMessage(@MessageBody() data: { roomId: string, messageId: string, userId: string, deleteForMe: boolean }) {
      await this.chatService.deleteMessage(data.messageId, data.userId, !data.deleteForMe);
      
      if (!data.deleteForMe) {
          // Broadcast to everyone (content removed)
          this.server.to(data.roomId).emit('message_deleted', { roomId: data.roomId, messageId: data.messageId });
      } else {
          // Just tell the user's clients
          const userSockets = this.connectedUsers.get(data.userId) || [];
          userSockets.forEach(socketId => {
              this.server.to(socketId).emit('message_deleted_for_me', { roomId: data.roomId, messageId: data.messageId, userId: data.userId });
          });
      }
  }

  @SubscribeMessage('clear_chat')
  async handleClearChat(@MessageBody() data: { roomId: string }) {
      await this.chatService.deleteAllMessages(data.roomId);
      this.server.to(data.roomId).emit('chat_cleared', { roomId: data.roomId });
  }

  @SubscribeMessage('check_online')
  async handleCheckOnline(@MessageBody() userId: string): Promise<{status: string, lastSeen: Date}> {
      const isOnline = this.connectedUsers.has(userId);
      if (isOnline) return { status: 'online', lastSeen: null };
      
      const dbStatus = await this.chatService.getUserStatus(userId);
      return { status: 'offline', lastSeen: dbStatus.lastSeen };
  }
}