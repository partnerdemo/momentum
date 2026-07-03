export interface Quest {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    pointsValue: number;
    rewardValue?: number; // Alternative field name
    status: 'Available' | 'Active' | 'Completed' | 'PendingApproval';
    claimedBy?: string | string[];
    completedBy?: string | string[];
    questType?: 'one-time' | 'recurring';
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        nextReset?: string;
    };
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface QuestCardProps {
    quest: Quest;
    onPress?: () => void;
    onClaim?: () => void;
    onComplete?: () => void;
    showActions?: boolean;
}

export interface QuestCardState {
    isAvailable: boolean;
    isActive: boolean;
    isCompleted: boolean;
    isPendingApproval: boolean;
    statusColor: string;
    statusIcon: string;
    statusLabel: string;
    actionLabel: string;
}
