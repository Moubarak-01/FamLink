
import { api } from './api';
import { SharedOuting } from '../types';

export const outingService = {
  async getAll() {
    const response = await api.get<SharedOuting[]>('/outings');
    return response.data;
  },

  async create(outingData: any) {
    const response = await api.post<SharedOuting>('/outings', outingData);
    return response.data;
  },

  async requestJoin(id: string, data: any) {
      const response = await api.post(`/outings/${id}/request`, data);
      return response.data;
  },
  
  async updateRequestStatus(outingId: string, parentId: string, status: string) {
      const response = await api.patch(`/outings/${outingId}/requests/${parentId}`, { status });
      return response.data;
  }
};
