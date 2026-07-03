import React, { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { BFF_API_URL } from '../services/base.api';
import { useAuth } from './AuthContext';
import { logger } from '../utils/logger';

interface SocketContextType {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  on: () => {}, off: () => {}, emit: () => {}, isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, householdId, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const baseUrl = BFF_API_URL.replace('/mobile-bff', '');
    const socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
    });

    socket.on('connect', () => {
      logger.info('🔌 WebSocket connected');
      setIsConnected(true);
      if (householdId) socket.emit('joinHousehold', householdId);
    });
    socket.on('disconnect', () => { setIsConnected(false); });
    socket.on('connect_error', (err) => { logger.error('WebSocket error:', err.message); });

    socketRef.current = socket;
    return () => {
      socket.removeAllListeners(); // Remove all listeners before disconnecting to prevent accumulation on reconnect
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, householdId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => { socketRef.current?.on(event, handler); }, []);
  const off = useCallback((event: string, handler: (...args: any[]) => void) => { socketRef.current?.off(event, handler); }, []);
  const emit = useCallback((event: string, ...args: any[]) => { socketRef.current?.emit(event, ...args); }, []);

  return <SocketContext.Provider value={{ on, off, emit, isConnected }}>{children}</SocketContext.Provider>;
}

export function useSocket() { return useContext(SocketContext); }
