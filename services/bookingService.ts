import { api } from './api';
import { BookingRequest } from '../types';

export const bookingService = {
  async create(bookingData: any) {
    const response = await api.post<BookingRequest>('/bookings', bookingData);
    return response.data;
  },

  async getAll() {
    const response = await api.get<BookingRequest[]>('/bookings');
    return response.data;
  },

  async updateStatus(bookingId: string, status: 'accepted' | 'declined') {
    const response = await api.patch<BookingRequest>(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  async delete(id: string) {
      const response = await api.delete(`/bookings/${id}`);
      return response.data;
  },

  async deleteAll() {
      const response = await api.delete('/bookings');
      return response.data;
  }
};