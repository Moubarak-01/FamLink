
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types';

class SocketService {
  private socket: Socket | null = null;
  public mockMode: boolean = true; // Default to mock until connected
  private messageHandlers: ((data: {roomId: string, message: ChatMessage}) => void)[] = [];

  connect() {
    // Attempt to connect to the local backend server
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
      if (!this.mockMode) { // Only log once on state change
         console.warn("⚠️ WebSocket connection failed (Backend not running?). Switching to Mock Mode.");
      }
      this.mockMode = true;
    });

    this.socket.on('receive_message', (data: {roomId: string, message: ChatMessage}) => {
      this.notifyHandlers(data);
    });
  }

  joinRoom(roomId: string) {
    if (this.socket && !this.mockMode) {
      this.socket.emit('join_room', roomId);
    } else {
      console.log(`[Mock Socket] Joined room: ${roomId}`);
    }
  }

  leaveRoom(roomId: string) {
     if (this.socket && !this.mockMode) {
      this.socket.emit('leave_room', roomId);
    } else {
       console.log(`[Mock Socket] Left room: ${roomId}`);
    }
  }

  sendMessage(roomId: string, message: ChatMessage) {
    if (this.socket && !this.mockMode) {
      this.socket.emit('send_message', { roomId, message });
    } else {
      // MOCK BEHAVIOR: Simulate receiving a message from "someone else" shortly after
      // purely for demonstration purposes in the preview environment.
      console.log(`[Mock Socket] Sent message to ${roomId}: ${message.text}`);
    }
  }

  // Subscribe to incoming messages
  onMessage(handler: (data: {roomId: string, message: ChatMessage}) => void) {
    this.messageHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  private notifyHandlers(data: {roomId: string, message: ChatMessage}) {
      this.messageHandlers.forEach(h => h(data));
  }
  
  isMocking() {
      return this.mockMode;
  }
}

export const socketService = new SocketService();
