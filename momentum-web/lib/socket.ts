// lib/socket.ts
// WebSocket client configuration and utilities
import { io, Socket } from 'socket.io-client';

// Get the WebSocket URL from environment or derive from API URL
const getSocketUrl = (): string => {
    const apiUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:3001/api/v1';
    // Remove /api/v1 from the end to get the base URL
    return apiUrl.replace('/api/v1', '');
};

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Initialize and return the WebSocket connection
 */
export const getSocket = (token?: string | null): Socket => {
    // If the socket already exists and the token matches (or we don't care about token changes for the singleton),
    // we could return existing. But if token changes, we should probably reconnect.
    // For simplicity, let's allow reconnection if called.

    if (socket && socket.connected) {
        // Check if we need to update auth? Socket.io doesn't easily support updating auth without reconnect.
        // We'll rely on the caller to disconnect first if token changes.
        return socket;
    }

    // If socket exists but disconnected, or null, create/connect.
    if (!socket) {
        const socketUrl = getSocketUrl();
        console.log('[WebSocket] Connecting to:', socketUrl);

        socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            auth: token ? { token: `Bearer ${token}` } : undefined, // Pass token in auth
        });

        // Connection event handlers
        socket.on('connect', () => {
            console.log('[WebSocket] Connected:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error.message);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('[WebSocket] Reconnection attempt:', attemptNumber);
        });

        socket.on('reconnect_failed', () => {
            console.error('[WebSocket] Reconnection failed');
        });
    } else if (!socket.connected) {
        // If socket exists but is disconnected, ensure auth is updated before connecting
        if (token) {
            socket.auth = { token: `Bearer ${token}` };
        }
        socket.connect();
    }

    return socket;
};

/**
 * Disconnect the WebSocket
 */
export const disconnectSocket = (): void => {
    if (socket) {
        console.log('[WebSocket] Disconnecting...');
        socket.disconnect();
        socket = null;
    }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
    return socket?.connected ?? false;
};

// Event type definitions for type safety
export interface TaskUpdatedEvent {
    type: 'create' | 'update' | 'delete';
    task?: any;
    taskId?: string;
    memberUpdate?: {
        memberId: string;
        pointsTotal: number;
    };
}

export interface QuestUpdatedEvent {
    type: 'create' | 'update' | 'delete';
    quest?: any;
    questId?: string;
}

export interface RoutineUpdatedEvent {
    type: 'create' | 'update' | 'delete';
    routine?: any;
    routineId?: string;
}

export interface MemberPointsUpdatedEvent {
    memberId: string;
    pointsTotal: number;
    householdId: string;
}

export interface StoreItemUpdatedEvent {
    type: 'create' | 'update' | 'delete';
    storeItem?: any;
    storeItemId?: string;
}

export interface HouseholdUpdatedEvent {
    type: 'update' | 'member_add' | 'member_update' | 'member_remove';
    householdId: string;
    householdName?: string;
    member?: any;
    memberProfile?: any;
    memberProfileId?: string;
}

export interface MealPlanUpdatedEvent {
    type: 'create' | 'update' | 'delete';
    mealPlan?: any;
    mealPlanId?: string;
    mealId?: string;
    householdId?: string | object;
}

// Event names as constants
export const SOCKET_EVENTS = {
    TASK_UPDATED: 'task_updated',
    QUEST_UPDATED: 'quest_updated',
    ROUTINE_UPDATED: 'routine_updated',
    MEMBER_POINTS_UPDATED: 'member_points_updated',
    STORE_ITEM_UPDATED: 'store_item_updated',
    HOUSEHOLD_UPDATED: 'household_updated',
    MEAL_PLAN_UPDATED: 'meal_plan_updated',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
