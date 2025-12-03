import { io, Socket } from 'socket.io-client';
import { ChatMessage, Notification } from '../types';

class SocketService {
  private socket: Socket | null = null;
  public mockMode: boolean = true; 
  private messageHandlers: ((data: {roomId: string, message: ChatMessage}) => void)[] = [];
  private notificationHandlers: ((notification: Notification) => void)[] = [];

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
      if (!this.mockMode) { 
         console.warn("⚠️ WebSocket connection failed. Switching to Mock Mode.");
      }
      this.mockMode = true;
    });

    this.socket.on('receive_message', (data: {roomId: string, message: ChatMessage}) => {
      this.messageHandlers.forEach(h => h(data));
    });

    // Listen for general notifications (Tasks, Bookings, etc.)
    this.socket.on('notification', (notification: Notification) => {
      this.notificationHandlers.forEach(h => h(notification));
    });
  }

  joinRoom(roomId: string) {
    if (this.socket && !this.mockMode) {
      this.socket.emit('join_room', roomId);
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
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // New handler for generic notifications
  onNotification(handler: (notification: Notification) => void) {
    this.notificationHandlers.push(handler);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }
}

export const socketService = new SocketService();