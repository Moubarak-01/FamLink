import { io, Socket } from 'socket.io-client';
import { ChatMessage, Notification } from '../types';
import { authService } from './authService';
import { cryptoService } from './cryptoService'; // Import new service

class SocketService {
  private socket: Socket | null = null;
  public connected: boolean = false;
  
  private messageHandlers: ((data: {roomId: string, message: ChatMessage}) => void)[] = [];
  private statusHandlers: ((data: {roomId: string, status: string, messageId?: string, userId?: string}) => void)[] = [];
  private presenceHandlers: ((data: {userId: string, status: 'online' | 'offline'}) => void)[] = [];
  private notificationHandlers: ((data: Notification) => void)[] = [];

  async connect(userId?: string) {
    if (this.socket?.connected) return;

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

    // DECRYPTION STEP for incoming message
    this.socket.on('receive_message', (data) => {
      data.message.plaintext = cryptoService.decryptMessage(data.message);
      this.messageHandlers.forEach(h => h(data));
    });
    
    this.socket.on('message_status_update', (data) => this.statusHandlers.forEach(h => h(data)));
    this.socket.on('messages_status_update', (data) => this.statusHandlers.forEach(h => h(data)));
    this.socket.on('user_presence', (data) => this.presenceHandlers.forEach(h => h(data)));
    this.socket.on('notification', (data) => this.notificationHandlers.forEach(h => h(data)));
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
      // ENCRYPTION STEP
      const { ciphertext, mac } = cryptoService.encryptMessage(message.text);
      
      // Prepare payload with ciphertext and MAC
      const encryptedPayload = {
        roomId, 
        message: { 
            ...message, 
            text: ciphertext, // Replace plaintext with ciphertext
            mac: mac           // Attach MAC
        } 
      };

      this.socket.emit('send_message', encryptedPayload, (response: any) => {
          if (callback && response) {
              // Decrypt saved message before passing to callback
              response.plaintext = cryptoService.decryptMessage(response);
              callback(response);
          }
      });
    }
  }

  checkOnlineStatus(userId: string, callback: (isOnline: boolean) => void) {
      if (this.socket && this.connected) {
          this.socket.emit('check_online', userId, (isOnline: boolean) => {
              callback(isOnline);
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

  onPresenceUpdate(handler: (data: {userId: string, status: 'online' | 'offline'}) => void) {
      this.presenceHandlers.push(handler);
      return () => { this.presenceHandlers = this.presenceHandlers.filter(h => h !== handler); };
  }

  onNotification(handler: (data: Notification) => void) {
      this.notificationHandlers.push(handler);
      return () => { this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler); };
  }
}

export const socketService = new SocketService();