import { io, Socket } from 'socket.io-client';
import { ChatMessage, Notification } from '../types';
import { authService } from './authService';
import { cryptoService } from './cryptoService';

class SocketService {
  private socket: Socket | null = null;
  public connected: boolean = false;
  
  private messageHandlers: ((data: {roomId: string, message: ChatMessage}) => void)[] = [];
  private statusHandlers: ((data: any) => void)[] = [];
  private presenceHandlers: ((data: {userId: string, status: 'online' | 'offline', lastSeen?: string}) => void)[] = [];
  private notificationHandlers: ((data: Notification) => void)[] = [];
  private reactionHandlers: ((data: {roomId: string, messageId: string, userId: string, emoji: string, type: 'add' | 'remove'}) => void)[] = [];
  private deleteHandlers: ((data: {roomId: string, messageId: string, isLocalDelete?: boolean}) => void)[] = [];
  private clearHandlers: ((data: {roomId: string}) => void)[] = [];
  private typingHandlers: ((data: {roomId: string, userId: string, userName: string, isTyping: boolean}) => void)[] = [];

  async connect(userId?: string) {
    // FIX: stricter check to prevent duplicate connections (double notifications)
    if (this.socket) {
        if (!this.socket.connected) {
            this.socket.connect();
        }
        return;
    }

    let currentUserId = userId;
    if (!currentUserId) {
        try {
            const profile = await authService.getProfile();
            currentUserId = profile?.id;
        } catch (e) { return; }
    }
    if (!currentUserId) return;

    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
      query: { userId: currentUserId },
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log("✅ Socket Connected");
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('receive_message', (data) => {
      if (!data.message.deleted) {
          data.message.plaintext = cryptoService.decryptMessage(data.message);
      } else {
          data.message.plaintext = "🚫 Message deleted";
      }
      this.messageHandlers.forEach(h => h(data));
    });
    
    this.socket.on('message_status_update', (data) => this.statusHandlers.forEach(h => h(data)));
    this.socket.on('messages_status_update', (data) => this.statusHandlers.forEach(h => h(data)));
    this.socket.on('user_presence', (data) => this.presenceHandlers.forEach(h => h(data)));
    this.socket.on('notification', (data) => this.notificationHandlers.forEach(h => h(data)));
    this.socket.on('reaction_added', (data) => this.reactionHandlers.forEach(h => h({ ...data, type: 'add' })));
    this.socket.on('reaction_removed', (data) => this.reactionHandlers.forEach(h => h({ ...data, type: 'remove' })));
    this.socket.on('message_deleted', (data) => this.deleteHandlers.forEach(h => h(data)));
    this.socket.on('message_deleted_for_me', (data) => this.deleteHandlers.forEach(h => h({ ...data, isLocalDelete: true })));
    this.socket.on('chat_cleared', (data) => this.clearHandlers.forEach(h => h(data)));
    this.socket.on('user_typing', (data) => this.typingHandlers.forEach(h => h({...data, isTyping: true})));
    this.socket.on('user_stop_typing', (data) => this.typingHandlers.forEach(h => h({...data, isTyping: false})));
  }

  disconnect() {
      if(this.socket) {
          this.socket.disconnect();
          this.connected = false;
      }
  }

  joinRoom(roomId: string, userId: string) {
    const emit = () => this.socket?.emit('join_room', { roomId, userId });
    if (this.socket && this.connected) emit();
    else if (this.socket) this.socket.once('connect', emit);
  }

  leaveRoom(roomId: string) {
     if (this.socket) this.socket.emit('leave_room', roomId);
  }

  sendMessage(roomId: string, message: ChatMessage, callback?: (savedMessage: ChatMessage) => void) {
    if (this.socket && this.connected) {
      const { ciphertext, mac } = cryptoService.encryptMessage(message.text);
      const encryptedPayload = {
        roomId, 
        message: { 
            ...message, 
            text: ciphertext,
            mac: mac,
            replyTo: message.replyTo
        } 
      };
      this.socket.emit('send_message', encryptedPayload, (response: any) => {
          if (callback && response) {
              response.plaintext = cryptoService.decryptMessage(response);
              callback(response);
          }
      });
    }
  }

  sendTyping(roomId: string, userId: string, userName: string) {
      this.socket?.emit('typing', { roomId, userId, userName });
  }

  // UPDATED: Now requires userName to ensure we remove the correct name from the list
  sendStopTyping(roomId: string, userId: string, userName: string) {
      this.socket?.emit('stop_typing', { roomId, userId, userName });
  }

  sendReaction(roomId: string, messageId: string, userId: string, emoji: string) {
      this.socket?.emit('add_reaction', { roomId, messageId, userId, emoji });
  }

  removeReaction(roomId: string, messageId: string, userId: string, emoji: string) {
      this.socket?.emit('remove_reaction', { roomId, messageId, userId, emoji });
  }

  deleteMessage(roomId: string, messageId: string, userId: string, deleteForMe: boolean = false) {
      this.socket?.emit('delete_message', { roomId, messageId, userId, deleteForMe });
  }

  clearChat(roomId: string) {
      this.socket?.emit('clear_chat', { roomId });
  }

  checkOnlineStatus(userId: string, callback: (data: {status: string, lastSeen: string | null}) => void) {
      if (this.socket && this.connected) {
          this.socket.emit('check_online', userId, (data: any) => {
              callback(data);
          });
      }
  }

  onMessage(handler: (data: {roomId: string, message: ChatMessage}) => void) {
    this.messageHandlers.push(handler);
    return () => { this.messageHandlers = this.messageHandlers.filter(h => h !== handler); };
  }
  
  onStatusUpdate(handler: (data: any) => void) {
      this.statusHandlers.push(handler);
      return () => { this.statusHandlers = this.statusHandlers.filter(h => h !== handler); };
  }

  onPresenceUpdate(handler: (data: {userId: string, status: 'online' | 'offline', lastSeen?: string}) => void) {
      this.presenceHandlers.push(handler);
      return () => { this.presenceHandlers = this.presenceHandlers.filter(h => h !== handler); };
  }

  onNotification(handler: (data: Notification) => void) {
      this.notificationHandlers.push(handler);
      return () => { this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler); };
  }

  onReaction(handler: (data: any) => void) {
      this.reactionHandlers.push(handler);
      return () => { this.reactionHandlers = this.reactionHandlers.filter(h => h !== handler); };
  }

  onMessageDeleted(handler: (data: any) => void) {
      this.deleteHandlers.push(handler);
      return () => { this.deleteHandlers = this.deleteHandlers.filter(h => h !== handler); };
  }

  onChatCleared(handler: (data: any) => void) {
      this.clearHandlers.push(handler);
      return () => { this.clearHandlers = this.clearHandlers.filter(h => h !== handler); };
  }

  onTyping(handler: (data: {roomId: string, userId: string, userName: string, isTyping: boolean}) => void) {
      this.typingHandlers.push(handler);
      return () => { this.typingHandlers = this.typingHandlers.filter(h => h !== handler); };
  }
}

export const socketService = new SocketService();