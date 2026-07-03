import { Task, TaskCardState } from './types';

/**
 * Get task ID (handles both _id and id fields)
 */
export const getTaskId = (task: Task): string => {
    return task._id || task.id || '';
};

/**
 * Get task points value (handles both pointsValue and value fields)
 */
export const getTaskPoints = (task: Task): number => {
    return task.pointsValue || task.value || 0;
};

/**
 * Calculate task card state based on status
 */
export const getTaskCardState = (task: Task): TaskCardState => {
    const isCompleted = task.status === 'Approved';
    const isPendingApproval = task.status === 'PendingApproval';
    const isPending = task.status === 'Pending';

    let statusColor = '#9CA3AF'; // Gray for pending
    let statusIcon = 'circle';
    let statusLabel = 'To do';

    if (isCompleted) {
        statusColor = '#16A34A'; // Green
        statusIcon = 'check-circle';
        statusLabel = 'Completed';
    } else if (isPendingApproval) {
        statusColor = '#F59E0B'; // Amber
        statusIcon = 'clock';
        statusLabel = 'Waiting for approval';
    }

    return {
        isCompleted,
        isPendingApproval,
        isPending,
        statusColor,
        statusIcon,
        statusLabel,
    };
};

/**
 * Get status label text
 */
export const getStatusLabel = (task: Task): string => {
    const state = getTaskCardState(task);
    return state.statusLabel;
};

/**
 * Format points display
 */
export const formatTaskPoints = (points: number): string => {
    return `+${points} pts`;
};

/**
 * Check if task can be completed
 */
export const canCompleteTask = (task: Task): boolean => {
    return task.status === 'Pending';
};

/**
 * Check if task can be edited
 */
export const canEditTask = (task: Task): boolean => {
    return task.status !== 'Approved';
};

/**
 * Check if task can be deleted
 */
export const canDeleteTask = (_task: Task): boolean => {
    return true; // Can always delete, but may want to add restrictions
};

/**
 * Get assigned member IDs from task
 */
export const getAssignedMemberIds = (task: Task): string[] => {
    if (!task.assignedTo || !Array.isArray(task.assignedTo)) {
        return [];
    }
    return task.assignedTo.map(member => member._id);
};

/**
 * Check if task is assigned to specific member
 */
export const isTaskAssignedToMember = (task: Task, memberId: string): boolean => {
    const assignedIds = getAssignedMemberIds(task);
    return assignedIds.includes(memberId);
};

/**
 * Get task age in days
 */
export const getTaskAgeDays = (task: Task): number => {
    if (!task.createdAt) return 0;

    const created = typeof task.createdAt === 'string'
        ? new Date(task.createdAt)
        : task.createdAt;

    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Check if task is overdue (older than 7 days and still pending)
 */
export const isTaskOverdue = (task: Task): boolean => {
    if (task.status !== 'Pending') return false;
    return getTaskAgeDays(task) > 7;
};
