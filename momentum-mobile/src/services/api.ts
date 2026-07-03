import { BaseApi, BFF_API_URL } from './base.api';
import { authService } from './auth.service';
import { taskService } from './task.service';
import { householdService } from './household.service';
import {
  ApiResponse, User, Member, LoginResponse, RegisterResponse, MeResponse,
  DashboardData, FamilyData, Task, Quest, StoreItem, Restaurant, Meal,
  Routine, RoutineItem, WishlistItem, Notification,
} from '../types';

class ApiService extends BaseApi {
  // Store
  async getStoreItems(): Promise<ApiResponse<{ storeItems: StoreItem[] }>> {
    return this.request<{ storeItems: StoreItem[] }>('/store');
  }
  async createStoreItem(itemData: Partial<StoreItem>): Promise<ApiResponse<StoreItem>> {
    return this.request<StoreItem>('/store', { method: 'POST', body: JSON.stringify(itemData) });
  }
  async updateStoreItem(itemId: string, itemData: Partial<StoreItem>): Promise<ApiResponse<StoreItem>> {
    return this.request<StoreItem>(`/store/${itemId}`, { method: 'PATCH', body: JSON.stringify(itemData) });
  }
  async deleteStoreItem(itemId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/store/${itemId}`, { method: 'DELETE' });
  }
  async purchaseItem(itemId: string, memberId: string): Promise<ApiResponse<{ newPointsTotal: number }>> {
    return this.request<{ newPointsTotal: number }>(`/store/${itemId}/purchase`, { method: 'POST', body: JSON.stringify({ memberId }) });
  }

  // Meals & Restaurants
  async getRestaurants(): Promise<ApiResponse<{ restaurants: Restaurant[] }>> {
    return this.request<{ restaurants: Restaurant[] }>('/meals/restaurants');
  }
  async createRestaurant(data: Partial<Restaurant>): Promise<ApiResponse<{ restaurant: Restaurant }>> {
    return this.request<{ restaurant: Restaurant }>('/meals/restaurants', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<ApiResponse<{ restaurant: Restaurant }>> {
    return this.request<{ restaurant: Restaurant }>(`/meals/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteRestaurant(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/meals/restaurants/${id}`, { method: 'DELETE' });
  }
  async getMeals(): Promise<ApiResponse<{ recipes: Meal[] }>> {
    return this.request<{ recipes: Meal[] }>('/meals/recipes');
  }
  async createMeal(data: Partial<Meal>): Promise<ApiResponse<{ recipe: Meal }>> {
    return this.request<{ recipe: Meal }>('/meals/recipes', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateMeal(id: string, data: Partial<Meal>): Promise<ApiResponse<{ recipe: Meal }>> {
    return this.request<{ recipe: Meal }>(`/meals/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteMeal(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/meals/recipes/${id}`, { method: 'DELETE' });
  }
  async getMealPlans(): Promise<ApiResponse<{ mealPlans: any[] }>> {
    return this.request<{ mealPlans: any[] }>('/meals/plans');
  }
  async createMealPlan(startDate: string, endDate: string): Promise<ApiResponse<{ mealPlan: any }>> {
    return this.request<{ mealPlan: any }>('/meals/plans', { method: 'POST', body: JSON.stringify({ startDate, endDate }) });
  }
  async addMealToPlan(planId: string, data: { dayOfWeek: string; mealType: string; itemType: string; itemId?: string; customTitle?: string }): Promise<ApiResponse<{ meal: any }>> {
    return this.request<{ meal: any }>(`/meals/plans/${planId}/meals`, { method: 'POST', body: JSON.stringify(data) });
  }
  async removeMealFromPlan(planId: string, mealId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/meals/plans/${planId}/meals/${mealId}`, { method: 'DELETE' });
  }
  async deleteMealPlan(planId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/meals/plans/${planId}`, { method: 'DELETE' });
  }
  async getUnratedMeals(): Promise<ApiResponse<{ unratedMeals: any[] }>> {
    return this.request<{ unratedMeals: any[] }>('/meals/unrated');
  }
  async rateMeal(mealId: string, rating: number): Promise<ApiResponse<{ meal: any }>> {
    return this.request<{ meal: any }>(`/meals/rate/${mealId}`, { method: 'POST', body: JSON.stringify({ rating }) });
  }

  // Routines
  async getAllRoutines(): Promise<ApiResponse<{ routines: Routine[] }>> {
    return this.request<{ routines: Routine[] }>('/routines');
  }
  async getMemberRoutines(memberId: string): Promise<ApiResponse<{ routines: Routine[] }>> {
    return this.request<{ routines: Routine[] }>(`/routines/member/${memberId}`);
  }
  async getRoutineById(routineId: string): Promise<ApiResponse<{ routine: Routine }>> {
    return this.request<{ routine: Routine }>(`/routines/${routineId}`);
  }
  async createRoutine(data: Partial<Routine>): Promise<ApiResponse<{ routine: Routine }>> {
    return this.request<{ routine: Routine }>('/routines', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateRoutine(id: string, data: Partial<Routine>): Promise<ApiResponse<{ routine: Routine }>> {
    return this.request<{ routine: Routine }>(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteRoutine(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/routines/${id}`, { method: 'DELETE' });
  }
  async toggleRoutineItem(routineId: string, itemId: string): Promise<ApiResponse<{ routine: Routine; item: RoutineItem }>> {
    return this.request<{ routine: Routine; item: RoutineItem }>(`/routines/${routineId}/items/${itemId}/toggle`, { method: 'POST' });
  }

  // Wishlist
  async getWishlist(memberId: string, includePurchased = false): Promise<ApiResponse<{ wishlistItems: WishlistItem[]; currentPoints: number }>> {
    return this.request<{ wishlistItems: WishlistItem[]; currentPoints: number }>(`/wishlist/member/${memberId}${includePurchased ? '?includePurchased=true' : ''}`);
  }
  async getHouseholdWishlist(householdId: string, includePurchased = false): Promise<ApiResponse<{ wishlistItems: WishlistItem[] }>> {
    return this.request<{ wishlistItems: WishlistItem[] }>(`/wishlist/household/${householdId}${includePurchased ? '?includePurchased=true' : ''}`);
  }
  async createWishlistItem(data: { memberId: string; householdId: string; title: string; description?: string; pointsCost: number; imageUrl?: string; priority?: string }): Promise<ApiResponse<{ wishlistItem: WishlistItem }>> {
    return this.request<{ wishlistItem: WishlistItem }>('/wishlist', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateWishlistItem(id: string, data: Partial<WishlistItem>): Promise<ApiResponse<{ wishlistItem: WishlistItem }>> {
    return this.request<{ wishlistItem: WishlistItem }>(`/wishlist/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteWishlistItem(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/wishlist/${id}`, { method: 'DELETE' });
  }
  async purchaseWishlistItem(id: string): Promise<ApiResponse<{ wishlistItem: WishlistItem; newPointsTotal: number }>> {
    return this.request<{ wishlistItem: WishlistItem; newPointsTotal: number }>(`/wishlist/${id}/purchase`, { method: 'POST' });
  }

  // PIN
  async setupPin(pin: string): Promise<ApiResponse<{ pinSetupCompleted: boolean }>> {
    return this.request<{ pinSetupCompleted: boolean }>('/pin/setup-pin', { method: 'POST', body: JSON.stringify({ pin }) });
  }
  async verifyPin(pin: string, memberId: string, householdId: string): Promise<ApiResponse<{ verified: boolean; memberId: string; userId: string; firstName: string; role: string }>> {
    const url = `${BFF_API_URL}/pin/verify-pin`;
    const headers = await this.getHeaders();
    const response = await fetch(url, { method: 'POST', headers: headers as HeadersInit, body: JSON.stringify({ pin, memberId, householdId }) });
    if (response.status === 401) return { status: 'error', data: { verified: false, memberId, userId: '', firstName: '', role: '' } } as any;
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'PIN verification failed'); }
    return await response.json();
  }
  async changePin(oldPin: string, newPin: string): Promise<ApiResponse<void>> {
    return this.request<void>('/pin/change-pin', { method: 'PUT', body: JSON.stringify({ oldPin, newPin }) });
  }
  async getPinStatus(): Promise<ApiResponse<{ pinSetupCompleted: boolean; lastPinVerification?: string }>> {
    return this.request<{ pinSetupCompleted: boolean; lastPinVerification?: string }>('/pin/pin-status');
  }

  // Household Links
  async generateLinkCode(childId: string): Promise<ApiResponse<{ code: string; expiresAt: string; childName: string }>> {
    return this.request<{ code: string; expiresAt: string; childName: string }>('/household/child/generate-link-code', { method: 'POST', body: JSON.stringify({ childId }) });
  }
  async linkExistingChild(code: string, displayName: string, profileColor: string): Promise<ApiResponse<{ child: Member; householdLink: any; message: string }>> {
    return this.request<{ child: Member; householdLink: any; message: string }>('/household/child/link-existing', { method: 'POST', body: JSON.stringify({ code, displayName, profileColor }) });
  }
  async validateLinkCode(code: string): Promise<ApiResponse<{ valid: boolean; childId: string; childName: string; expiresAt: string }>> {
    return this.request<{ valid: boolean; childId: string; childName: string; expiresAt: string }>(`/household/child/validate-code/${code}`);
  }
  async getHouseholdLinks(): Promise<ApiResponse<{ links: any[]; count: number }>> {
    return this.request<{ links: any[]; count: number }>('/household/links');
  }
  async getLinkSettings(linkId: string): Promise<ApiResponse<{ link: any }>> {
    return this.request<{ link: any }>(`/household/link/${linkId}/settings`);
  }
  async proposeSettingChange(linkId: string, setting: string, newValue: string): Promise<ApiResponse<{ message: string; pendingChange: any }>> {
    return this.request<{ message: string; pendingChange: any }>(`/household/link/${linkId}/propose-change`, { method: 'POST', body: JSON.stringify({ setting, newValue }) });
  }
  async approveChange(linkId: string, changeId: string): Promise<ApiResponse<{ message: string; updatedSettings: any }>> {
    return this.request<{ message: string; updatedSettings: any }>(`/household/link/${linkId}/approve-change/${changeId}`, { method: 'POST' });
  }
  async rejectChange(linkId: string, changeId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/household/link/${linkId}/reject-change/${changeId}`, { method: 'POST' });
  }
  async unlinkChild(childId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/household/child/${childId}/unlink`, { method: 'POST' });
  }

  // Notifications
  async sendParentReminder(): Promise<ApiResponse<{ message: string; data: any }>> {
    return this.request<{ message: string; data: any }>('/notifications/remind', { method: 'POST' });
  }
  async getNotifications(): Promise<ApiResponse<{ notifications: Notification[]; unreadCount: number }>> {
    return this.request<{ notifications: Notification[]; unreadCount: number }>('/notifications');
  }
  async markAsRead(id: string): Promise<ApiResponse<{ notification: Notification }>> {
    return this.request<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' });
  }
  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/notifications/read-all', { method: 'PATCH' });
  }
  async savePushToken(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/notifications/push-token', { method: 'POST', body: JSON.stringify({ token }) });
  }

  // Calendar
  async connectGoogleCalendar(data: { idToken: string; accessToken: string; serverAuthCode?: string }): Promise<ApiResponse<any>> {
    return this.request<any>('/calendar/google/connect', { method: 'POST', body: JSON.stringify(data) });
  }
  async getGoogleCalendarEvents(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/calendar/google/events');
  }
  async listGoogleCalendars(): Promise<ApiResponse<{ calendars: any[] }>> {
    return this.request<{ calendars: any[] }>('/calendar/google/list');
  }

  // Generic helpers
  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }
  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiService = new ApiService();

export const api = {
  // Composed Auth Services
  login: authService.login.bind(authService),
  googleLogin: authService.googleLogin.bind(authService),
  register: authService.register.bind(authService),
  getMe: authService.getMe.bind(authService),
  completeOnboarding: authService.completeOnboarding.bind(authService),

  // Composed Household Services
  getDashboardData: householdService.getDashboardData.bind(householdService),
  getFamilyData: householdService.getFamilyData.bind(householdService),
  createMember: householdService.createMember.bind(householdService),
  updateMember: householdService.updateMember.bind(householdService),
  deleteMember: householdService.deleteMember.bind(householdService),
  setFocusTask: householdService.setFocusTask.bind(householdService),

  // Composed Task & Quest Services
  getTasks: taskService.getTasks.bind(taskService),
  createTask: taskService.createTask.bind(taskService),
  completeTask: taskService.completeTask.bind(taskService),
  approveTask: taskService.approveTask.bind(taskService),
  rejectTask: taskService.rejectTask.bind(taskService),
  updateTask: taskService.updateTask.bind(taskService),
  deleteTask: taskService.deleteTask.bind(taskService),
  getQuests: taskService.getQuests.bind(taskService),
  createQuest: taskService.createQuest.bind(taskService),
  updateQuest: taskService.updateQuest.bind(taskService),
  deleteQuest: taskService.deleteQuest.bind(taskService),
  claimQuest: taskService.claimQuest.bind(taskService),
  completeQuest: taskService.completeQuest.bind(taskService),
  approveQuest: taskService.approveQuest.bind(taskService),

  // Direct Api Services
  getStoreItems: apiService.getStoreItems.bind(apiService),
  createStoreItem: apiService.createStoreItem.bind(apiService),
  updateStoreItem: apiService.updateStoreItem.bind(apiService),
  deleteStoreItem: apiService.deleteStoreItem.bind(apiService),
  purchaseItem: apiService.purchaseItem.bind(apiService),
  getRestaurants: apiService.getRestaurants.bind(apiService),
  createRestaurant: apiService.createRestaurant.bind(apiService),
  updateRestaurant: apiService.updateRestaurant.bind(apiService),
  deleteRestaurant: apiService.deleteRestaurant.bind(apiService),
  getMeals: apiService.getMeals.bind(apiService),
  createMeal: apiService.createMeal.bind(apiService),
  updateMeal: apiService.updateMeal.bind(apiService),
  deleteMeal: apiService.deleteMeal.bind(apiService),
  getMealPlans: apiService.getMealPlans.bind(apiService),
  createMealPlan: apiService.createMealPlan.bind(apiService),
  addMealToPlan: apiService.addMealToPlan.bind(apiService),
  removeMealFromPlan: apiService.removeMealFromPlan.bind(apiService),
  deleteMealPlan: apiService.deleteMealPlan.bind(apiService),
  getUnratedMeals: apiService.getUnratedMeals.bind(apiService),
  rateMeal: apiService.rateMeal.bind(apiService),
  getAllRoutines: apiService.getAllRoutines.bind(apiService),
  getMemberRoutines: apiService.getMemberRoutines.bind(apiService),
  getRoutineById: apiService.getRoutineById.bind(apiService),
  createRoutine: apiService.createRoutine.bind(apiService),
  updateRoutine: apiService.updateRoutine.bind(apiService),
  deleteRoutine: apiService.deleteRoutine.bind(apiService),
  toggleRoutineItem: apiService.toggleRoutineItem.bind(apiService),
  getWishlist: apiService.getWishlist.bind(apiService),
  getHouseholdWishlist: apiService.getHouseholdWishlist.bind(apiService),
  createWishlistItem: apiService.createWishlistItem.bind(apiService),
  updateWishlistItem: apiService.updateWishlistItem.bind(apiService),
  deleteWishlistItem: apiService.deleteWishlistItem.bind(apiService),
  purchaseWishlistItem: apiService.purchaseWishlistItem.bind(apiService),
  setupPin: apiService.setupPin.bind(apiService),
  verifyPin: apiService.verifyPin.bind(apiService),
  changePin: apiService.changePin.bind(apiService),
  getPinStatus: apiService.getPinStatus.bind(apiService),
  generateLinkCode: apiService.generateLinkCode.bind(apiService),
  linkExistingChild: apiService.linkExistingChild.bind(apiService),
  validateLinkCode: apiService.validateLinkCode.bind(apiService),
  getHouseholdLinks: apiService.getHouseholdLinks.bind(apiService),
  getLinkSettings: apiService.getLinkSettings.bind(apiService),
  proposeSettingChange: apiService.proposeSettingChange.bind(apiService),
  approveChange: apiService.approveChange.bind(apiService),
  rejectChange: apiService.rejectChange.bind(apiService),
  unlinkChild: apiService.unlinkChild.bind(apiService),
  sendParentReminder: apiService.sendParentReminder.bind(apiService),
  getNotifications: apiService.getNotifications.bind(apiService),
  markAsRead: apiService.markAsRead.bind(apiService),
  markAllAsRead: apiService.markAllAsRead.bind(apiService),
  savePushToken: apiService.savePushToken.bind(apiService),
  connectGoogleCalendar: apiService.connectGoogleCalendar.bind(apiService),
  getGoogleCalendarEvents: apiService.getGoogleCalendarEvents.bind(apiService),
  listGoogleCalendars: apiService.listGoogleCalendars.bind(apiService),

  // Generic helpers
  post: apiService.post.bind(apiService),
  patch: apiService.patch.bind(apiService),
  delete: apiService.delete.bind(apiService),
};
