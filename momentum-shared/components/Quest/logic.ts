import { Quest, QuestCardState } from './types';

/**
 * Get quest ID (handles both _id and id fields)
 */
export const getQuestId = (quest: Quest): string => {
    return quest._id || quest.id || '';
};

/**
 * Get quest points value (handles both pointsValue and rewardValue fields)
 */
export const getQuestPoints = (quest: Quest): number => {
    return quest.pointsValue || quest.rewardValue || 0;
};

/**
 * Calculate quest card state based on status
 */
export const getQuestCardState = (quest: Quest): QuestCardState => {
    const isAvailable = quest.status === 'Available' || !quest.status;
    const isActive = quest.status === 'Active';
    const isCompleted = quest.status === 'Completed';
    const isPendingApproval = quest.status === 'PendingApproval';

    let statusColor = '#6366F1'; // Indigo for available
    let statusIcon = 'map';
    let statusLabel = 'Available';
    let actionLabel = 'Start Quest';

    if (isActive) {
        statusColor = '#F59E0B'; // Amber
        statusIcon = 'compass';
        statusLabel = 'In Progress';
        actionLabel = 'Complete';
    } else if (isCompleted) {
        statusColor = '#16A34A'; // Green
        statusIcon = 'check-circle';
        statusLabel = 'Completed';
        actionLabel = '';
    } else if (isPendingApproval) {
        statusColor = '#8B5CF6'; // Purple
        statusIcon = 'clock';
        statusLabel = 'Waiting for Approval';
        actionLabel = '';
    }

    return {
        isAvailable,
        isActive,
        isCompleted,
        isPendingApproval,
        statusColor,
        statusIcon,
        statusLabel,
        actionLabel,
    };
};

/**
 * Format points display
 */
export const formatQuestPoints = (points: number): string => {
    return `${points} pts`;
};

/**
 * Check if quest can be claimed
 */
export const canClaimQuest = (quest: Quest): boolean => {
    return quest.status === 'Available' || !quest.status;
};

/**
 * Check if quest can be completed
 */
export const canCompleteQuest = (quest: Quest): boolean => {
    return quest.status === 'Active';
};
