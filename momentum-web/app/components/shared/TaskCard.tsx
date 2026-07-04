import React from 'react';
import { Award, Edit, Trash, CheckSquare, Clock, Circle } from 'lucide-react';
import {
    getTaskCardState,
    formatTaskPoints,
    type Task,
    type TaskCardProps
} from 'momentum-shared';
import MemberAvatar from './MemberAvatar';

// Adapter to match the shared Task interface with the web's ITask interface if needed
// or just use the shared Task interface directly if compatible.
// The web ITask has: _id, title, description, pointsValue, isCompleted, assignedTo
// The shared Task has: _id, title, description, pointsValue, status, assignedTo
// We might need to map isCompleted to status for the shared logic to work.

const TaskCard: React.FC<TaskCardProps & { onApprove?: (task: Task) => void }> = ({ task, onEdit, onDelete, onApprove }) => {
    // Map web task to shared task structure if necessary
    // Assuming task comes in with status or we derive it
    const sharedTask: Task = {
        ...task,
        status: task.status,
    };

    const {
        isCompleted,
        isPendingApproval,
        statusColor,
        statusLabel
    } = getTaskCardState(sharedTask);

    return (
        <div className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
            <div className="flex items-center space-x-4">
                {/* Icon uses semantic color role */}
                <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-action-primary" />
                </div>
                <div>
                    <p className="text-base font-medium text-text-primary">{task.title}</p>
                    <p className="text-sm text-text-secondary">{task.description || 'No description'}</p>

                    {/* Display assigned member avatars */}
                    {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-text-secondary mr-1">Assigned:</span>
                            {task.assignedTo.map((member: any) => (
                                <div key={member._id || member.id} title={member.displayName}>
                                    <MemberAvatar
                                        name={member.displayName}
                                        color={member.profileColor}
                                        size={24}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {/* Points Value uses signal color */}
                <div className="text-center">
                    <p className="text-lg font-semibold text-signal-success">
                        {formatTaskPoints(task.pointsValue)}
                    </p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>

                {/* --- Task Actions & Status --- */}
                {isCompleted && (
                    <div className="flex items-center text-signal-success">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">{statusLabel}</span>
                    </div>
                )}

                {isPendingApproval && (
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center text-signal-warning">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{statusLabel}</span>
                        </div>
                        {onApprove && (
                            <button
                                onClick={() => onApprove(task)}
                                className="px-3 py-1 bg-signal-success text-white text-sm rounded hover:bg-signal-success/90 transition-colors"
                            >
                                Approve
                            </button>
                        )}
                    </div>
                )}

                {onEdit && (
                    <button
                        onClick={() => onEdit(task)}
                        className="p-2 text-text-secondary hover:text-action-primary transition-colors"
                        title="Edit Task"
                        disabled={isCompleted}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                )}

                {onDelete && (
                    <button
                        onClick={() => onDelete(task)}
                        className="p-2 text-text-secondary hover:text-signal-alert transition-colors"
                        title="Delete Task"
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
