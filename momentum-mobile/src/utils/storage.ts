import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const KEYS = {
  TOKEN: '@momentum_token',
  USER: '@momentum_user',
  HOUSEHOLD_ID: '@momentum_household_id',
};

export const storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },
  async getUser(): Promise<User | null> {
    const json = await AsyncStorage.getItem(KEYS.USER);
    return json ? JSON.parse(json) : null;
  },
  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  async getHouseholdId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.HOUSEHOLD_ID);
  },
  async setHouseholdId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.HOUSEHOLD_ID, id);
  },
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.HOUSEHOLD_ID]);
  },
};
