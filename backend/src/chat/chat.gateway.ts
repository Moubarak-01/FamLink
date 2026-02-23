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
import { JwtService } from '@nestjs/jwt'; // <--- Import JwtService
import { ConfigService } from '@nestjs/config'; // <--- Import ConfigService for CORS URL

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string[]>();

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService, // <--- Inject
  ) { }

  async handleConnection(client: Socket) {
    try {
      // 1. Extract Token (Auth Object > Query > Header)
      let token = client.handshake.auth?.token || client.handshake.query?.token;

      // Fallback: Check 'cookie' header if using cookies
      if (!token && client.request.headers.cookie) {
        // Simple extraction, actual parsing might be needed if multiple cookies
        const cookies = client.request.headers.cookie.split(';');
        const jwtCookie = cookies.find(c => c.trim().startsWith('jwt='));
        if (jwtCookie) {
          token = jwtCookie.split('=')[1];
        }
      }

      if (!token) {
        console.warn(`[Gateway] Connection attempted without token: ${client.id}`);
        // We might allow anonymous for some cases, but for Chat we strictly require auth
        client.disconnect();
        return;
      }

      // 2. Verify Token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // 3. Store Identity
      client.data.userId = userId;
      client.data.user = payload;

      // 4. Existing Logic
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

        console.log(`✅ [Gateway] User connected: ${userId} (${client.id})`);
      }
    } catch (err) {
      console.error(`❌ [Gateway] Auth failed for socket ${client.id}:`, err.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId; // Use authenticated ID
    if (userId && this.connectedUsers.has(userId)) {
      const sockets = this.connectedUsers.get(userId).filter(id => id !== client.id);
      if (sockets.length === 0) {
        this.connectedUsers.delete(userId);

        // Update DB status to Offline + LastSeen
        const updatedUser = await this.chatService.updateUserStatus(userId, 'offline');
        if (updatedUser) {
          this.server.emit('user_presence', {
            userId,
            status: 'offline',
            lastSeen: updatedUser.lastSeen // Broadcast last seen time
          });
        }
      } else {
        this.connectedUsers.set(userId, sockets);
      }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() payload: { roomId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    client.join(payload.roomId);
    const updatedIds = await this.chatService.markMessagesAsSeen(payload.roomId, userId);
    if (updatedIds.length > 0) {
      this.server.to(payload.roomId).emit('messages_status_update', {
        roomId: payload.roomId,
        status: 'seen',
        userId: userId
      });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { roomId: string, userName: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    client.to(data.roomId).emit('user_typing', { ...data, userId });
  }

  // UPDATED: Now accepts and broadcasts 'userName' so the client knows who stopped typing
  @SubscribeMessage('stop_typing')
  handleStopTyping(@MessageBody() data: { roomId: string, userName: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    client.to(data.roomId).emit('user_stop_typing', { ...data, userId });
  }

  @SubscribeMessage('mark_delivered')
  async handleMarkDelivered(@MessageBody() data: { messageId: string, roomId: string }, @ConnectedSocket() client: Socket) {
    const message = await this.chatService.markMessageAsDelivered(data.messageId);
    if (message) {
      this.server.to(`user_${message.senderId}`).emit('message_status_update', {
        messageId: message._id.toString(),
        roomId: message.roomId,
        status: 'delivered'
      });
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: { roomId: string, message: { text: string, mac: string, replyTo?: string } }, @ConnectedSocket() client: Socket) {
    console.log(`🔔 [Gateway] send_message event received from socket ${client.id}`);
    const senderId = client.data.userId; // Securely get senderId from Auth
    console.log(`🔔 [Gateway] Payload: roomId=${data.roomId}, senderId=${senderId}`);

    try {
      const { text, mac, replyTo } = data.message;
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

      // Broadcast to the chat room (for users WITH chat open)
      client.to(data.roomId).emit('receive_message', { roomId: data.roomId, message: payload });

      // CRITICAL FIX: Also broadcast to the user's personal channel (for users WITHOUT chat open)
      // This ensures they get the message for notifications and delivery confirmation
      if (receiverIdStr) {
        console.log(`📤 [Gateway] Also emitting to user_${receiverIdStr}`);
        this.server.to(`user_${receiverIdStr}`).emit('receive_message', { roomId: data.roomId, message: payload });

        // Create notification for the bell icon        
        await this.notificationsService.create(
          receiverIdStr,
          `New message from ${payload.senderName}`,
          'chat',
          data.roomId,
          { senderName: payload.senderName }
        );
      }

      // SYNC: Also emit to the sender's personal channel to sync other open tabs/devices
      this.server.to(`user_${senderId}`).emit('receive_message', { roomId: data.roomId, message: payload });

      console.log(`✅ [Gateway] Message processed successfully, returning payload`);
      return payload;
    } catch (error) {
      console.error(`❌ [Gateway] ERROR in handleMessage:`, error);
      throw error; // Re-throw so Socket.IO knows something went wrong
    }
  }

  @SubscribeMessage('add_reaction')
  async handleAddReaction(@MessageBody() data: { roomId: string, messageId: string, emoji: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    const message = await this.chatService.addReaction(data.messageId, userId, data.emoji);
    this.server.to(data.roomId).emit('reaction_added', { ...data, userId });

    // Send notification to message author if someone ELSE reacted
    if (message && message.senderId.toString() !== userId) {
      const reactor = await this.chatService.getUserById(userId);
      const reactorName = reactor ? reactor.fullName : 'Someone';

      await this.notificationsService.create(
        message.senderId.toString(),
        `${reactorName} reacted to your message with ${data.emoji}`,
        'chat_reaction',
        data.roomId,
        { reactorName, emoji: data.emoji }
      );
    }
  }

  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(@MessageBody() data: { roomId: string, messageId: string, emoji: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    await this.chatService.removeReaction(data.messageId, userId, data.emoji);
    this.server.to(data.roomId).emit('reaction_removed', { ...data, userId });
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(@MessageBody() data: { roomId: string, messageId: string, deleteForMe: boolean }, @ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    await this.chatService.deleteMessage(data.messageId, userId, !data.deleteForMe);

    if (!data.deleteForMe) {
      // Broadcast to everyone (content removed)
      this.server.to(data.roomId).emit('message_deleted', { roomId: data.roomId, messageId: data.messageId });
    } else {
      // Just tell the user's clients
      const userSockets = this.connectedUsers.get(userId) || [];
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit('message_deleted_for_me', { roomId: data.roomId, messageId: data.messageId, userId: userId });
      });
    }
  }

  @SubscribeMessage('clear_chat')
  async handleClearChat(@MessageBody() data: { roomId: string }) {
    await this.chatService.deleteAllMessages(data.roomId);
    this.server.to(data.roomId).emit('chat_cleared', { roomId: data.roomId });
  }

  @SubscribeMessage('check_online')
  async handleCheckOnline(@MessageBody() userId: string) {
    const isOnline = this.connectedUsers.has(userId);
    if (isOnline) return { status: 'online', lastSeen: null };
    const dbStatus = await this.chatService.getUserStatus(userId);
    return { status: 'offline', lastSeen: dbStatus.lastSeen ? dbStatus.lastSeen : null };
  }

}
