
import { api } from './api';
import { Notification } from '../types';

export const notificationService = {
  async getAll() {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  async markRead(id: string) {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllRead() {
    await api.post('/notifications/read-all');
  }
};
