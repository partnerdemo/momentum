// src/services/calendarService.ts
import { api } from './api';
import { ApiResponse, Event } from '../types';

class CalendarService {
  async getEvents(): Promise<ApiResponse<Event[]>> {
    const response = await api.getDashboardData();
    return {
      status: 'success',
      data: response.data?.events || [],
    };
  }

  async createEvent(eventData: Partial<Event>): Promise<ApiResponse<Event>> {
    return api.post<Event>('/calendar/events', eventData);
  }

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<ApiResponse<Event>> {
    return api.patch<Event>(`/calendar/events/${eventId}`, eventData);
  }

  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/calendar/events/${eventId}`);
  }

  async syncGoogleCalendar(): Promise<ApiResponse<any>> {
    return api.getGoogleCalendarEvents();
  }
}

export const calendarService = new CalendarService();
