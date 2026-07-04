// =========================================================
// silkpanda/momentum/app/components/tasks/DeleteTaskModal.tsx
// Modal for deleting a task
// REFACTORED (v4) to call Embedded Web BFF
// =========================================================
'use client';

import React, { useState } from 'react';
import { Loader, X, AlertTriangle, Trash } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { ITask } from '../../types';

interface DeleteTaskModalProps {
    task: ITask;
    onClose: () => void;
    onTaskDeleted: () => void;
}

const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({
    task, onClose, onTaskDeleted
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const handleDelete = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/web-bff/tasks/${task._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete task.');
            }

            onTaskDeleted();
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center">
                    <div className="p-3 bg-signal-alert/10 rounded-full">
                        <AlertTriangle className="w-8 h-8 text-signal-alert" />
                    </div>
                </div>

                <h3 className="text-xl font-medium text-text-primary text-center mt-4">
                    Delete Task?
                </h3>
                <p className="text-sm text-text-secondary text-center mt-2">
                    Are you sure you want to delete the task <strong className="text-text-primary">"{task.title}"</strong>?
                    This action cannot be undone.
                </p>

                {/* Error Display */}
                {error && (
                    <div className="flex items-center text-sm text-signal-alert mt-4 p-3 bg-signal-alert/10 rounded-md border border-signal-alert/20">
                        <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                       text-text-secondary bg-border-subtle hover:bg-border-subtle/80"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className={`w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-signal-alert/60' : 'bg-signal-alert hover:bg-signal-alert/80'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Trash className="w-5 h-5 mr-2" />}
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTaskModal;