// lib/providers/SocketProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, SOCKET_EVENTS } from '../socket';

interface SocketContextValue {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    isConnected: false,
});

export const useSocketContext = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

import { useSession } from '../../app/components/layout/SessionContext';

// ... (keep surrounding code)

export function SocketProvider({ children }: SocketProviderProps) {
    const { token, householdId } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // If we have an existing socket and the token changes, we might want to disconnect/reconnect
        // Or getSocket handles it? getSocket returns existing if connected.
        // So we should strictly disconnect if we want to force re-init with new token.
        disconnectSocket();

        // Initialize socket connection with token
        const socketInstance = getSocket(token);
        setSocket(socketInstance);

        // Set up connection status handlers
        const handleConnect = () => {
            console.log('[SocketProvider] Connected');
            setIsConnected(true);
            if (householdId) {
                console.log('[SocketProvider] Joining household:', householdId);
                socketInstance.emit('join_household', householdId);
            }
        };

        const handleDisconnect = (reason: string) => {
            console.log('[SocketProvider] Disconnected:', reason);
            setIsConnected(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('[SocketProvider] Connection error:', error.message);
            setIsConnected(false);
        };

        // Set initial connection status
        setIsConnected(socketInstance.connected);

        // Attach event listeners
        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on('connect_error', handleConnectError);

        // Cleanup on unmount or token change
        return () => {
            socketInstance.off('connect', handleConnect);
            socketInstance.off('disconnect', handleDisconnect);
            socketInstance.off('connect_error', handleConnectError);

            // Disconnect socket when provider unmounts or token changes
            disconnectSocket();
        };
    }, [token, householdId]);

    // Enhanced logic to join room if householdId loads LATER than the socket connection
    useEffect(() => {
        if (socket && isConnected && householdId) {
            console.log('[SocketProvider] Ensuring household join:', householdId);
            socket.emit('join_household', householdId);
        }
    }, [socket, isConnected, householdId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
            {/* Optional: Connection status indicator */}
            {process.env.NODE_ENV === 'development' && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '10px',
                        right: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: isConnected ? '#10b981' : '#ef4444',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        zIndex: 9999,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                >
                    WS: {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            )}
        </SocketContext.Provider>
    );
}
