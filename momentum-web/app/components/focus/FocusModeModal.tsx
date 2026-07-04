import React, { useState } from 'react';
import { ITask, IHouseholdMemberProfile } from '../../types';
import Modal from '../shared/Modal';
import { Target } from 'lucide-react';
import { useSession } from '../layout/SessionContext';

interface FocusModeModalProps {
    member: IHouseholdMemberProfile;
    tasks: ITask[];
    onClose: () => void;
    onFocusSet: (taskId: string | null) => void;
}

const FocusModeModal: React.FC<FocusModeModalProps> = ({ member, tasks, onClose, onFocusSet }) => {
    const { token } = useSession();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(member.focusedTaskId || null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSetFocus = async () => {
        setIsLoading(true);
        try {
            // Assuming endpoint exists
            const response = await fetch(`/web-bff/family/members/${member._id}/focus`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ taskId: selectedTaskId }),
            });

            if (!response.ok) throw new Error('Failed to set focus');

            onFocusSet(selectedTaskId);
            onClose();
        } catch (error) {
            console.error(error);
            // Handle error
        } finally {
            setIsLoading(false);
        }
    };

    const assignedTasks = tasks.filter(t => t.status !== 'Approved' && t.assignedTo.some(a => a._id === member._id));

    return (
        <Modal isOpen={true} onClose={onClose} title="Set Focus Task" maxWidth="max-w-lg">
            <div className="flex flex-col h-full max-h-[80vh]">
                {/* Header Subtitle */}
                <div className="px-6 py-4 border-b border-border-subtle bg-bg-surface/50">
                    <p className="text-text-secondary">
                        Select which task <span className="font-medium text-text-primary">{member.displayName}</span> should focus on.
                    </p>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {assignedTasks.length > 0 ? (
                        assignedTasks.map(task => (
                            <button
                                key={task._id}
                                onClick={() => setSelectedTaskId(task._id === selectedTaskId ? null : task._id)}
                                className={`w-full flex items-start p-4 rounded-xl border-2 transition-all text-left group
                                    ${selectedTaskId === task._id
                                        ? 'bg-action-primary/5 border-action-primary shadow-sm'
                                        : 'bg-bg-surface border-border-subtle hover:border-action-primary/50'}`}
                            >
                                {/* Radio Indicator */}
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 mt-0.5 flex items-center justify-center transition-colors
                                    ${selectedTaskId === task._id
                                        ? 'border-action-primary'
                                        : 'border-text-tertiary group-hover:border-action-primary/50'}`}
                                >
                                    {selectedTaskId === task._id && (
                                        <div className="w-3 h-3 rounded-full bg-action-primary" />
                                    )}
                                </div>

                                {/* Task Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <h4 className={`font-semibold text-lg truncate pr-2 ${selectedTaskId === task._id ? 'text-action-primary' : 'text-text-primary'}`}>
                                            {task.title}
                                        </h4>
                                        <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-action-primary/10 text-action-primary">
                                            +{task.pointsValue} pts
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-bg-surface/50 rounded-full p-4 inline-block mb-3">
                                <Target className="w-8 h-8 text-text-tertiary" />
                            </div>
                            <p className="text-text-secondary">No active tasks available for {member.displayName}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border-subtle bg-bg-surface flex items-center justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-medium text-text-secondary hover:bg-bg-canvas transition-colors border border-transparent hover:border-border-subtle"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSetFocus}
                        disabled={isLoading || !selectedTaskId}
                        className="px-8 py-3 bg-action-primary text-white rounded-xl font-bold shadow-lg shadow-action-primary/20 
                                 hover:bg-action-hover hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
                    >
                        {isLoading ? 'Setting Focus...' : 'Set Focus'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FocusModeModal;
