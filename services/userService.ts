
import { api } from './api';
import { User } from '../types';

export const userService = {
  async getProfile() {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(profileData: any) {
    const response = await api.patch<User>('/users/profile', profileData);
    return response.data;
  },

  async getNannies() {
    const response = await api.get<User[]>('/users/nannies');
    return response.data;
  },

  async addNanny(nannyId: string) {
    const response = await api.post<User>(`/users/nannies/${nannyId}/add`);
    return response.data;
  },

  async removeNanny(nannyId: string) {
    const response = await api.delete<User>(`/users/nannies/${nannyId}/remove`);
    return response.data;
  },

  async deleteAccount() {
    const response = await api.delete('/users/profile');
    return response.data;
  }
};
