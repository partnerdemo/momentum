import { BaseApi } from './base.api';
import { ApiResponse, LoginResponse, RegisterResponse, MeResponse, User } from '../types';

class AuthService extends BaseApi {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async googleLogin(idToken: string, serverAuthCode?: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, serverAuthCode }),
    });
  }

  async register(userData: {
    firstName: string; lastName: string; email: string; password: string;
    role: string; householdName: string; userDisplayName: string; userProfileColor: string;
  }): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe(): Promise<ApiResponse<MeResponse>> {
    return this.request<MeResponse>('/auth/me');
  }

  async completeOnboarding(data: {
    userId: string; householdId: string; householdName?: string;
    displayName: string; profileColor: string; pin: string;
    calendarChoice?: 'sync' | 'create'; selectedCalendarId?: string;
  }): Promise<ApiResponse<{ user: User; household: any }>> {
    return this.request<{ user: User; household: any }>('/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const authService = new AuthService();
