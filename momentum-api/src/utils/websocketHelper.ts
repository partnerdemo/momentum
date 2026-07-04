// src/utils/websocketHelper.ts
import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import mongoose from 'mongoose';

// Define the shape of our WebSocket events
interface TaskEventPayload {
    task?: any;
    type?: 'create' | 'update' | 'delete' | 'reject';
    taskId?: string;
    memberUpdate?: any;
}

type IO = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

/**
 * Helper to emit task-related events to a household
 */
export const emitTaskEvent = (
    io: IO,
    householdId: string | mongoose.Types.ObjectId,
    eventName: string,
    payload: TaskEventPayload
) => {
    if (!householdId) {
        console.warn('⚠️ Attempted to emit socket event without householdId');
        return;
    }

    const roomId = householdId.toString();

    // Unified payload structure
    const unifiedPayload = {
        type: payload.type || 'update',
        task: payload.task,
        taskId: payload.taskId,
        memberUpdate: payload.memberUpdate
    };

    // 1. Emit the single unified 'taskUpdated' event for the client's DataContext
    io.to(roomId).emit('taskUpdated', unifiedPayload);

    // 2. If a specific legacy/tracking event name is requested (e.g. 'task_created') and it's not 'taskUpdated', emit it as well
    if (eventName !== 'taskUpdated' && eventName !== 'task_updated') {
        io.to(roomId).emit(eventName, unifiedPayload);
    }
};

/**
 * Helper to emit member updates (e.g., points change)
 */
export const emitMemberUpdate = (
    io: IO,
    householdId: string | mongoose.Types.ObjectId,
    memberId: string | mongoose.Types.ObjectId,
    updates: any
) => {
    if (!householdId) return;

    io.to(householdId.toString()).emit('member_updated', {
        memberId: memberId.toString(),
        ...updates,
        timestamp: new Date()
    });
};
