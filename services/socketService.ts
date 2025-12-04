import { io, Socket } from 'socket.io-client';
import { ChatMessage, Notification } from '../types';

class SocketService {
  private socket: Socket | null = null;
  public mockMode: boolean = true; 
  private messageHandlers: ((data: {roomId: string, message: ChatMessage}) => void)[] = [];
  private notificationHandlers: ((notification: Notification) => void)[] = [];
  // Feature 2: Status Handler
  private statusHandlers: ((data: {roomId: string, status: string, messageId?: string, userId?: string}) => void)[] = [];

  connect() {
    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      timeout: 2000
    });

    this.socket.on('connect', () => {
      console.log("✅ Connected to WebSocket server");
      this.mockMode = false;
    });

    this.socket.on('connect_error', (err) => {
      if (!this.mockMode) console.warn("⚠️ WebSocket connection failed. Switching to Mock Mode.");
      this.mockMode = true;
    });

    this.socket.on('receive_message', (data: {roomId: string, message: ChatMessage}) => {
      // Send 'delivered' receipt back immediately if connected
      if (!this.mockMode && this.socket && data.message.senderId) {
           // Assuming we are the recipient
           this.socket.emit('mark_delivered', { roomId: data.roomId, messageId: data.message.id, userId: 'me' });
      }
      this.messageHandlers.forEach(h => h(data));
    });

    this.socket.on('notification', (notification: Notification) => {
      this.notificationHandlers.forEach(h => h(notification));
    });

    // Feature 2: Listen for status updates (seen/delivered)
    this.socket.on('message_status_update', (data: any) => {
         this.statusHandlers.forEach(h => h(data));
    });
    
    this.socket.on('messages_status_update', (data: any) => {
         this.statusHandlers.forEach(h => h(data));
    });
  }

  joinRoom(roomId: string, userId?: string) {
    if (this.socket && !this.mockMode) {
      this.socket.emit('join_room', { roomId, userId });
    }
  }

  leaveRoom(roomId: string) {
     if (this.socket && !this.mockMode) {
      this.socket.emit('leave_room', roomId);
    }
  }

  sendMessage(roomId: string, message: ChatMessage, callback?: (savedMessage: ChatMessage) => void) {
    if (this.socket && !this.mockMode) {
      this.socket.emit('send_message', { roomId, message }, (response: any) => {
          if (callback && response) {
              callback(response);
          }
      });
    } else {
      if (callback) setTimeout(() => callback(message), 100);
    }
  }

  onMessage(handler: (data: {roomId: string, message: ChatMessage}) => void) {
    this.messageHandlers.push(handler);
    return () => { this.messageHandlers = this.messageHandlers.filter(h => h !== handler); };
  }

  onNotification(handler: (notification: Notification) => void) {
    this.notificationHandlers.push(handler);
    return () => { this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler); };
  }
  
  onStatusUpdate(handler: (data: any) => void) {
      this.statusHandlers.push(handler);
      return () => { this.statusHandlers = this.statusHandlers.filter(h => h !== handler); };
  }
}

export const socketService = new SocketService();