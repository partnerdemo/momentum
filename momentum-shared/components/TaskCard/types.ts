export interface Task {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    pointsValue: number;
    value?: number; // Alternative field name
    status: 'Pending' | 'PendingApproval' | 'Approved';
    assignedTo?: Array<{
        _id: string;
        displayName: string;
        profileColor: string;
    }>;
    completedBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface TaskCardProps {
    task: Task;
    onPress?: () => void;
    onComplete?: () => void;
    onEdit?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    showActions?: boolean;
    members?: any[];
}

export interface TaskCardState {
    isCompleted: boolean;
    isPendingApproval: boolean;
    isPending: boolean;
    statusColor: string;
    statusIcon: string;
    statusLabel: string;
}
