
import { api } from './api';
import { Task } from '../types';

export const taskService = {
  async create(taskData: { nannyId: string, description: string, dueDate: string }) {
    const response = await api.post<Task>('/user-tasks', taskData);
    return response.data;
  },

  async getAll() {
    const response = await api.get<Task[]>('/user-tasks');
    return response.data;
  },

  async updateStatus(taskId: string, status: 'pending' | 'completed') {
    const response = await api.patch<Task>(`/user-tasks/${taskId}/status`, { status });
    return response.data;
  }
};
