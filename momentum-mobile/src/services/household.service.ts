import { BaseApi } from './base.api';
import { ApiResponse, DashboardData, FamilyData, Member } from '../types';

class HouseholdService extends BaseApi {
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return this.request<DashboardData>('/household/dashboard');
  }
  async getFamilyData(): Promise<ApiResponse<FamilyData>> {
    return this.request<FamilyData>('/household/family');
  }
  async createMember(data: { householdId: string; firstName: string; role: 'Parent' | 'Child'; profileColor: string; displayName?: string }): Promise<ApiResponse<{ member: Member }>> {
    return this.request<{ member: Member }>('/household/members', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateMember(memberId: string, data: { householdId: string; firstName?: string; role?: 'Parent' | 'Child'; profileColor?: string; displayName?: string }): Promise<ApiResponse<{ member: Member }>> {
    return this.request<{ member: Member }>(`/household/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteMember(memberId: string, householdId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/household/members/${memberId}`, { method: 'DELETE', body: JSON.stringify({ householdId }) });
  }
  async setFocusTask(householdId: string, memberProfileId: string, taskId: string | null): Promise<ApiResponse<any>> {
    return this.request<any>('/household/focus-task', { method: 'POST', body: JSON.stringify({ householdId, memberProfileId, taskId }) });
  }
}

export const householdService = new HouseholdService();
