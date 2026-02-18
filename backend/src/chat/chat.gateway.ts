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
import { CallLogService } from './call-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string[]>();
  private activeCalls = new Map<string, { callLogId: string, startTime: number }>(); // Track active calls

  constructor(
    private readonly chatService: ChatService,
    private readonly callLogService: CallLogService,
    private readonly notificationsService: NotificationsService,
  ) { }

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

  // UPDATED: Now accepts and broadcasts 'userName' so the client knows who stopped typing
  @SubscribeMessage('stop_typing')
  handleStopTyping(@MessageBody() data: { roomId: string, userId: string, userName: string }, @ConnectedSocket() client: Socket) {
    client.to(data.roomId).emit('user_stop_typing', data);
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
  async handleMessage(@MessageBody() data: { roomId: string, message: { senderId: string, text: string, mac: string, replyTo?: string } }, @ConnectedSocket() client: Socket) {
    console.log(`🔔 [Gateway] send_message event received from socket ${client.id}`);
    console.log(`🔔 [Gateway] Payload: roomId=${data.roomId}, senderId=${data.message.senderId}`);

    try {
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
  async handleAddReaction(@MessageBody() data: { roomId: string, messageId: string, userId: string, emoji: string }) {
    const message = await this.chatService.addReaction(data.messageId, data.userId, data.emoji);
    this.server.to(data.roomId).emit('reaction_added', data);

    // Send notification to message author if someone ELSE reacted
    if (message && message.senderId.toString() !== data.userId) {
      const reactor = await this.chatService.getUserById(data.userId);
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
  async handleCheckOnline(@MessageBody() userId: string) {
    const isOnline = this.connectedUsers.has(userId);
    if (isOnline) return { status: 'online', lastSeen: null };
    const dbStatus = await this.chatService.getUserStatus(userId);
    return { status: 'offline', lastSeen: dbStatus.lastSeen ? dbStatus.lastSeen : null };
  }

  // --- WebRTC Signaling with Call Logging ---

  @SubscribeMessage('call_user')
  async handleCallUser(
    @MessageBody() data: { userToCall: string, signalData: any, from: string, name: string, callType?: 'video' | 'voice' },
    @ConnectedSocket() client: Socket
  ) {
    console.log(`📞 [Gateway] Call (${data.callType || 'video'}) from ${data.from} to ${data.userToCall}`);

    // Create call log entry
    try {
      const callerInfo = await this.chatService.getUserById(data.from);
      const receiverInfo = await this.chatService.getUserById(data.userToCall);

      const callLog = await this.callLogService.createCallLog({
        callerId: data.from,
        callerName: data.name || callerInfo?.fullName || 'Unknown',
        callerPhoto: callerInfo?.photo,
        receiverId: data.userToCall,
        receiverName: receiverInfo?.fullName || 'Unknown',
        receiverPhoto: receiverInfo?.photo,
        callType: data.callType || 'video',
      });

      // Store active call reference with caller-receiver key
      const callKey = `${data.from}_${data.userToCall}`;
      this.activeCalls.set(callKey, {
        callLogId: callLog._id.toString(),
        startTime: Date.now()
      });

      // Also emit callLogId to caller for tracking
      client.emit('call_log_created', { callLogId: callLog._id.toString() });

      this.server.to(`user_${data.userToCall}`).emit('call_received', {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        callType: data.callType || 'video'
      });
    } catch (err) {
      console.error('Error creating call log:', err);
      // Still emit the call even if logging fails
      this.server.to(`user_${data.userToCall}`).emit('call_received', {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        callType: data.callType || 'video'
      });
    }
  }

  @SubscribeMessage('answer_call')
  async handleAnswerCall(
    @MessageBody() data: { to: string, signal: any },
    @ConnectedSocket() client: Socket
  ) {
    const answererId = client.handshake.query.userId as string;
    console.log(`✅ [Gateway] Call answered by ${answererId} for caller ${data.to}`);

    // Update call log to 'in_progress' (will be 'completed' on end)
    const callKey = `${data.to}_${answererId}`;
    const activeCall = this.activeCalls.get(callKey);
    if (activeCall) {
      // Reset start time to when call was actually connected
      this.activeCalls.set(callKey, { ...activeCall, startTime: Date.now() });
    }

    const targets = this.connectedUsers.get(data.to);
    if (targets) {
      targets.forEach(socketId => {
        this.server.to(socketId).emit('call_accepted', data.signal);
      });
    } else {
      console.warn(`⚠️ [Gateway] Caller ${data.to} not found/connected during answer_call`);
    }
  }

  @SubscribeMessage('ice_candidate')
  handleIceCandidate(@MessageBody() data: { to: string, candidate: any }) {
    const targets = this.connectedUsers.get(data.to);
    if (targets) {
      targets.forEach(socketId => {
        this.server.to(socketId).emit('ice_candidate_received', data.candidate);
      });
    }
  }

  @SubscribeMessage('end_call')
  async handleEndCall(
    @MessageBody() data: { to: string, callLogId?: string, duration?: number },
    @ConnectedSocket() client: Socket
  ) {
    const enderId = client.handshake.query.userId as string;
    console.log(`🛑 [Gateway] Call ended by ${enderId} for ${data.to}`);

    // Try to find and update the call log
    // Check both directions since either party can end the call
    const callKey1 = `${enderId}_${data.to}`;
    const callKey2 = `${data.to}_${enderId}`;
    const activeCall = this.activeCalls.get(callKey1) || this.activeCalls.get(callKey2);

    if (activeCall) {
      const duration = Math.floor((Date.now() - activeCall.startTime) / 1000);
      try {
        await this.callLogService.updateCallStatus(
          activeCall.callLogId,
          duration > 0 ? 'completed' : 'no_answer',
          duration
        );
      } catch (err) {
        console.error('Failed to update call log:', err);
      }

      // Cleanup
      this.activeCalls.delete(callKey1);
      this.activeCalls.delete(callKey2);
    }

    const targets = this.connectedUsers.get(data.to);
    if (targets) {
      targets.forEach(socketId => {
        this.server.to(socketId).emit('call_ended');
      });
    }
  }

  @SubscribeMessage('reject_call')
  async handleRejectCall(
    @MessageBody() data: { callerId: string },
    @ConnectedSocket() client: Socket
  ) {
    const rejecterId = client.handshake.query.userId as string;
    console.log(`❌ [Gateway] Call rejected by ${rejecterId} from ${data.callerId}`);

    const callKey = `${data.callerId}_${rejecterId}`;
    const activeCall = this.activeCalls.get(callKey);

    if (activeCall) {
      try {
        await this.callLogService.updateCallStatus(activeCall.callLogId, 'rejected', 0);
      } catch (err) {
        console.error('Failed to update call log:', err);
      }
      this.activeCalls.delete(callKey);
    }

    // Notify caller that call was rejected
    const targets = this.connectedUsers.get(data.callerId);
    if (targets) {
      targets.forEach(socketId => {
        this.server.to(socketId).emit('call_rejected');
      });
    }
  }
}

