import { BaseApi } from './base.api';
import { ApiResponse, Task, Quest } from '../types';

class TaskService extends BaseApi {
  async getTasks(): Promise<ApiResponse<{ tasks: Task[] }>> {
    return this.request<{ tasks: Task[] }>('/tasks');
  }
  async createTask(taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request<Task>('/tasks', { method: 'POST', body: JSON.stringify(taskData) });
  }
  async completeTask(taskId: string, memberId: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${taskId}/complete`, { method: 'POST', body: JSON.stringify({ memberId }) });
  }
  async approveTask(taskId: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${taskId}/approve`, { method: 'POST' });
  }
  async rejectTask(taskId: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${taskId}/reject`, { method: 'POST' });
  }
  async updateTask(taskId: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(taskData) });
  }
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/tasks/${taskId}`, { method: 'DELETE' });
  }
  async getQuests(): Promise<ApiResponse<{ quests: Quest[] }>> {
    return this.request<{ quests: Quest[] }>('/quests');
  }
  async createQuest(questData: Partial<Quest>): Promise<ApiResponse<Quest>> {
    return this.request<Quest>('/quests', { method: 'POST', body: JSON.stringify(questData) });
  }
  async updateQuest(questId: string, questData: Partial<Quest>): Promise<ApiResponse<Quest>> {
    return this.request<Quest>(`/quests/${questId}`, { method: 'PATCH', body: JSON.stringify(questData) });
  }
  async deleteQuest(questId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/quests/${questId}`, { method: 'DELETE' });
  }
  async claimQuest(questId: string, memberId: string): Promise<ApiResponse<Quest>> {
    return this.request<Quest>(`/quests/${questId}/claim`, { method: 'POST', body: JSON.stringify({ memberId }) });
  }
  async completeQuest(questId: string, memberId: string): Promise<ApiResponse<Quest>> {
    return this.request<Quest>(`/quests/${questId}/complete`, { method: 'POST', body: JSON.stringify({ memberId }) });
  }
  async approveQuest(questId: string, memberId: string): Promise<ApiResponse<Quest>> {
    return this.request<Quest>(`/quests/${questId}/approve`, { method: 'POST', body: JSON.stringify({ memberId }) });
  }
}

export const taskService = new TaskService();
