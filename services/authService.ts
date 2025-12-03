
import { api } from './api';
import { UserType } from '../types';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async signup(fullName: string, email: string, password: string, userType: UserType) {
    const response = await api.post('/auth/signup', { fullName, email, password, userType });
    return response.data;
  },
  
  async getProfile() {
      const response = await api.get('/users/profile');
      return response.data;
  }
};
