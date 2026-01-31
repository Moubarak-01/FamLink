// services/chatService.ts
import { api } from './api';
import { ChatMessage } from '../types';
import { cryptoService } from './cryptoService';

export const chatService = {
    async getHistory(roomId: string): Promise<ChatMessage[]> {
        const response = await api.get<any[]>(`/chat/${roomId}`);

        return response.data.map(msg => {
            // Ensure sender object structure with null safety
            const sender = (msg.senderId && typeof msg.senderId === 'object') ? msg.senderId : {};

            const transformedMsg: ChatMessage = {
                id: msg.id || msg._id,
                senderId: sender.id || sender._id || (typeof msg.senderId === 'string' ? msg.senderId : 'unknown'),
                senderName: sender.fullName || 'Unknown',
                senderPhoto: sender.photo || '',
                text: msg.text,
                mac: msg.mac,
                timestamp: msg.createdAt || Date.now(),
                status: msg.status,
                reactions: msg.reactions || [], // Map reactions
                replyTo: msg.replyTo,          // Map replyTo ID
                deleted: msg.deleted || false  // Map deleted status
            };

            // Only decrypt if not deleted
            if (!transformedMsg.deleted) {
                transformedMsg.plaintext = cryptoService.decryptMessage(transformedMsg);
            } else {
                transformedMsg.plaintext = "🚫 Message deleted";
            }

            return transformedMsg;
        });
    },

    // Standard REST delete (fallback or admin use)
    async deleteMessage(id: string) {
        const response = await api.delete(`/chat/message/${id}`);
        return response.data;
    },

    // Standard REST clear chat (fallback or admin use)
    async deleteAllMessages(roomId: string) {
        const response = await api.delete(`/chat/room/${roomId}`);
        return response.data;
    }
};