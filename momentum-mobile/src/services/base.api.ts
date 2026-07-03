import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import Constants from 'expo-constants';

export const BFF_API_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:3002/mobile-bff';

if (BFF_API_URL.includes('localhost') || BFF_API_URL.includes('127.0.0.1')) {
  console.log(`[BaseApi] API URL is pointing to local BFF: ${BFF_API_URL}`);
} else {
  console.log(`[BaseApi] API URL is pointing to production/preview BFF: ${BFF_API_URL}`);
}

export class BaseApi {
  protected async getHeaders(): Promise<Record<string, string>> {
    const token = await storage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ status: string; data?: T; message?: string; token?: string }> {
    const url = `${BFF_API_URL}${endpoint}`;
    const headers = await this.getHeaders();
    const maxAttempts = 3;
    const baseDelay = 1000;

    let lastResponse: Response | null = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          ...options,
          headers: { ...headers, ...(options.headers || {}) },
          signal: controller.signal,
        });
        lastResponse = response;

        // If throttled (429), retry with exponential backoff if attempts remain
        if (response.status === 429 && attempt < maxAttempts - 1) {
          const delayMs = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
          logger.warn(`Got 429 on ${endpoint}, retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${maxAttempts - 1})...`);
          await this.delay(delayMs);
          continue;
        }
        break;
      } catch (error: any) {
        lastError = error;
        // If timeout (AbortError) or general network error, retry with backoff if attempts remain
        if (attempt < maxAttempts - 1) {
          const delayMs = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
          const isTimeout = error.name === 'AbortError';
          logger.warn(`${isTimeout ? 'Timeout' : 'Network error'} on ${endpoint}, retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1}/${maxAttempts - 1})...`);
          await this.delay(delayMs);
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!lastResponse) {
      throw lastError || new Error(`Request to ${endpoint} failed.`);
    }

    const json = await lastResponse.json().catch(() => ({}));

    if (!lastResponse.ok) {
      const msg = json.message || `Request failed with status ${lastResponse.status}`;
      throw new Error(msg);
    }

    return json;
  }
}
