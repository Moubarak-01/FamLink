import { api } from './api';
import { ChatMessage } from '../types';
import { cryptoService } from './cryptoService'; // Import new service

export const chatService = {
  async getHistory(roomId: string): Promise<ChatMessage[]> {
    const response = await api.get<any[]>(`/chat/${roomId}`);
    
    // Transform backend format to frontend ChatMessage format
    return response.data.map(msg => {
        // msg.senderId is populated with { _id, fullName, photo } from the backend
        const sender = typeof msg.senderId === 'object' ? msg.senderId : {}; 
        
        const transformedMsg: ChatMessage = {
            id: msg.id || msg._id,
            senderId: sender.id || sender._id || msg.senderId || 'unknown',
            senderName: sender.fullName || 'Unknown',
            senderPhoto: sender.photo || '',
            text: msg.text,
            mac: msg.mac, // Include mac from backend
            timestamp: msg.createdAt || Date.now(),
            status: msg.status
        };

        // DECRYPTION STEP for historical messages
        transformedMsg.plaintext = cryptoService.decryptMessage(transformedMsg);
        
        return transformedMsg;
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