import { api } from './api';
import { ChatMessage } from '../types';

export const chatService = {
  async getHistory(roomId: string): Promise<ChatMessage[]> {
    const response = await api.get<any[]>(`/chat/${roomId}`);
    
    // Transform backend format to frontend ChatMessage format
    return response.data.map(msg => {
        // msg.senderId is populated with { _id, fullName, photo } from the backend
        const sender = typeof msg.senderId === 'object' ? msg.senderId : {}; 
        
        return {
            id: msg.id || msg._id,
            senderId: sender.id || sender._id || msg.senderId || 'unknown',
            senderName: sender.fullName || 'Unknown',
            senderPhoto: sender.photo || '',
            text: msg.text,
            timestamp: msg.createdAt || Date.now(),
        };
    });
  },

  async deleteMessage(id: string) {
      const response = await api.delete(`/chat/message/${id}`);
      return response.data;
  },

  async deleteAllMessages(roomId: string) {
      const response = await api.delete(`/chat/room/${roomId}`);
      return response.data;
  }
};