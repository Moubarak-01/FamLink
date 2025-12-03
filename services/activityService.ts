
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
  }
};
