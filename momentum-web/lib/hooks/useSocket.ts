// lib/hooks/useSocket.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SocketEventName } from '../socket';
import { useSocketContext } from '../providers/SocketProvider';

/**
 * Custom hook for WebSocket functionality
 * Returns the socket instance from the SocketProvider
 */
export function useSocket() {
    const { socket } = useSocketContext();
    return socket;
}

/**
 * Custom hook to listen to a specific WebSocket event
 * @param eventName - The name of the event to listen to
 * @param callback - The callback function to execute when the event is received
 */
export function useSocketEvent<T = any>(
    eventName: SocketEventName | string,
    callback: (data: T) => void
) {
    const socket = useSocket();
    const callbackRef = useRef(callback);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket) return;

        const handler = (data: T) => {
            callbackRef.current(data);
        };

        // Subscribe to event
        socket.on(eventName, handler);

        // Cleanup: unsubscribe from event
        return () => {
            socket.off(eventName, handler);
        };
    }, [socket, eventName]);
}

/**
 * Custom hook to emit WebSocket events
 */
export function useSocketEmit() {
    const socket = useSocket();

    const emit = useCallback(
        (eventName: string, data?: any) => {
            if (socket?.connected) {
                socket.emit(eventName, data);
            } else {
                console.warn('[WebSocket] Cannot emit event - socket not connected:', eventName);
            }
        },
        [socket]
    );

    return emit;
}

/**
 * Custom hook to get socket connection status
 */
export function useSocketStatus() {
    const { isConnected } = useSocketContext();
    return isConnected;
}
