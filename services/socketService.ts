import { io, Socket } from 'socket.io-client';
import { ChatMessage, Notification } from '../types';
import { authService } from './authService'; // Assuming we can get user ID or pass it in

class SocketService {
  private socket: Socket | null = null;
  public mockMode: boolean = true; 
  private messageHandlers: ((data: {roomId: string, message: ChatMessage}) => void)[] = [];
  private statusHandlers: ((data: {roomId: string, status: string, messageId?: string, userId?: string}) => void)[] = [];

  // Called from useAppLogic or App.tsx
  async connect(userId?: string) {
    if (this.socket?.connected) return;

    // 1. Get User ID if not passed (e.g., from local storage or auth service state)
    let currentUserId = userId;
    if (!currentUserId) {
        const profile = await authService.getProfile().catch(() => null);
        currentUserId = profile?.id;
    }

    if (!currentUserId) return; // Don't connect without user ID

    // 2. Connect with Query Param
    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
      query: { userId: currentUserId }, // CRITICAL: Tells backend WHO just came online
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log("✅ Socket Connected");
      this.mockMode = false;
    });

    // Listeners
    this.socket.on('receive_message', (data) => {
        this.messageHandlers.forEach(h => h(data));
    });

    this.socket.on('message_status_update', (data) => {
        this.statusHandlers.forEach(h => h(data));
    });
    
    this.socket.on('messages_status_update', (data) => {
        this.statusHandlers.forEach(h => h(data));
    });
  }

  disconnect() {
      if(this.socket) this.socket.disconnect();
  }

  joinRoom(roomId: string, userId: string) {
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
          if (callback && response) callback(response);
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
}

export const socketService = new SocketService();