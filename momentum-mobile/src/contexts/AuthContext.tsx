import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { User, LoginResponse, RegisterResponse } from '../types';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  householdId: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string, serverAuthCode?: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateAuthState: (newToken: string, newUser: User, newHouseholdId: string) => Promise<void>;
}

interface RegisterData {
  firstName: string; lastName: string; email: string; password: string;
  role: string; householdName: string; userDisplayName: string; userProfileColor: string; inviteCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Ref (not state) so the guard doesn't trigger extra renders
  const isLoadingAuthRef = React.useRef(false);

  useEffect(() => { loadStoredAuth(); }, []);

  const loadStoredAuth = async () => {
    // Guard against concurrent calls (e.g. StrictMode double-invoke or fast remounts)
    if (isLoadingAuthRef.current) return;
    isLoadingAuthRef.current = true;
    try {
      const [storedToken, storedUser, storedHouseholdId] = await Promise.all([
        storage.getToken(), storage.getUser(), storage.getHouseholdId(),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken); setUser(storedUser); setHouseholdId(storedHouseholdId);
        try {
          const response = await api.getMe();
          if (response.data) { setUser(response.data.user); setHouseholdId(response.data.householdId); }
        } catch (error: any) {
          if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('expired') || error.message.includes('no longer exists') || error.message.includes('Something went wrong'))) {
            await clearAuth();
          }
        }
      }
    } catch (error) {
      logger.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
      isLoadingAuthRef.current = false;
    }
  };

  const saveAndSetAuth = async (newToken: string, newUser: User, newHouseholdId: string) => {
    await Promise.all([storage.setToken(newToken), storage.setUser(newUser), storage.setHouseholdId(newHouseholdId)]);
    setToken(newToken); setUser(newUser); setHouseholdId(newHouseholdId);
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.token && response.data) {
      await saveAndSetAuth(response.token, response.data.parent, response.data.primaryHouseholdId);
    } else throw new Error('Invalid response from server');
  };

  const googleLogin = async (idToken: string, serverAuthCode?: string) => {
    try {
      logger.info('Calling backend googleLogin...');
      const response = await api.googleLogin(idToken, serverAuthCode);
      logger.info('Backend response:', !!response.token);
      if (response.token && response.data) {
        await saveAndSetAuth(response.token, response.data.parent, response.data.primaryHouseholdId);
      } else {
        throw new Error(response.message || 'Invalid response from server');
      }
    } catch (error: any) {
      logger.error('Google Login Error:', error.message);
      // Re-throw so screen can show alert
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    const response = await api.register(userData);
    if (response.token && response.data) {
      const hId = response.data.household._id || response.data.household.id;
      await saveAndSetAuth(response.token, response.data.parent, hId);
    } else throw new Error('Invalid response from server');
  };

  const clearAuth = async () => { await storage.clearAll(); setToken(null); setUser(null); setHouseholdId(null); };
  const logout = async () => { await clearAuth(); };

  const refreshUser = async () => {
    try {
      const response = await api.getMe();
      if (response.data) { setUser(response.data.user); setHouseholdId(response.data.householdId); await storage.setUser(response.data.user); await storage.setHouseholdId(response.data.householdId); }
    } catch (error) { logger.error('Failed to refresh user:', error); }
  };

  const updateAuthState = async (newToken: string, newUser: User, newHouseholdId: string) => { await saveAndSetAuth(newToken, newUser, newHouseholdId); };

  return (
    <AuthContext.Provider value={{ user, householdId, token, isLoading, isAuthenticated: !!user && !!token, login, googleLogin, register, logout, refreshUser, updateAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
