
import { api } from './api';
import { SkillRequest } from '../types';

export const marketplaceService = {
  async getAll() {
    const response = await api.get<SkillRequest[]>('/marketplace');
    return response.data;
  },

  async create(taskData: any) {
    const response = await api.post<SkillRequest>('/marketplace', taskData);
    return response.data;
  },

  async makeOffer(taskId: string, offerData: { offerAmount: number; message: string }) {
    const response = await api.post<SkillRequest>(`/marketplace/${taskId}/offers`, offerData);
    return response.data;
  },

  async updateOfferStatus(taskId: string, helperId: string, status: 'accepted' | 'declined') {
    const response = await api.patch<SkillRequest>(`/marketplace/${taskId}/offers/${helperId}`, { status });
    return response.data;
  }
};
