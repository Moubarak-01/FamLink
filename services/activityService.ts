import { api } from './api';
import { Activity } from '../types';

export const activityService = {
  async getAll() {
    const response = await api.get<Activity[]>('/activities');
    return response.data;
  },

  async create(activityData: any) {
    const response = await api.post<Activity>('/activities', activityData);
    return response.data;
  },

  async join(id: string) {
    const response = await api.patch<Activity>(`/activities/${id}/join`);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },

  async deleteAll() {
    const response = await api.delete(`/activities`);
    return response.data;
  }
};