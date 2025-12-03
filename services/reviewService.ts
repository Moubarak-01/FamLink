
import { api } from './api';

export const reviewService = {
  async create(targetId: string, rating: number, comment: string) {
    const response = await api.post('/reviews', { targetId, rating, comment });
    return response.data;
  },

  async getReviews(userId: string) {
    const response = await api.get(`/reviews/${userId}`);
    return response.data;
  }
};
