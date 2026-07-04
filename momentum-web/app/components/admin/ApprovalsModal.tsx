'use client';

import React, { useState } from 'react';
import { CheckCircle, X, DollarSign, Award } from 'lucide-react';
import Modal from '../shared/Modal';
import { ITask, IHouseholdMemberProfile } from '../../types';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface ApprovalsModalProps {
    onClose: () => void;
}

const ApprovalsModal: React.FC<ApprovalsModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { tasks, members, updateTask, refresh } = useFamilyData();
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal States
    const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Get pending tasks (status is PendingApproval)
    const pendingTasks = tasks.filter(t => t.status === 'PendingApproval');

    const handleApprove = async (taskId: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            // Optimistic Update
            updateTask(taskId, { status: 'Approved' });

            const response = await fetch(`/web-bff/tasks/${taskId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve task');
            }

            // Silent refresh in background to ensure consistency
            refresh();

            if (pendingTasks.length === 1) {
                setTimeout(() => onClose(), 500);
            }
        } catch (error) {
            console.error('Approve error:', error);
            // Revert on error (could be improved with undo log, but simplest is full refresh)
            refresh();
            showAlert('Error', 'Failed to approve task', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (isProcessing || !confirmRejectId) return;

        setIsProcessing(true);
        const taskId = confirmRejectId;

        try {
            // Optimistic Update
            updateTask(taskId, { status: 'Pending', completedBy: undefined });

            const response = await fetch(`/web-bff/tasks/${taskId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reject task');
            }

            // Silent refresh
            refresh();

            setConfirmRejectId(null);
            showAlert('Success', 'Task rejected. It has been moved back to pending list.', 'success');
        } catch (error) {
            console.error('Reject error:', error);
            refresh();
            showAlert('Error', 'Failed to reject task', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderApprovalCard = (task: ITask) => {
        const completedByMember = members.find(m => {
            // Check if member profile ID matches
            if (m._id === task.completedBy) return true;
            // Check if familyMemberId (object) matches
            if (typeof m.familyMemberId === 'object' && m.familyMemberId._id === task.completedBy) return true;
            return false;
        });

        return (
            <div
                key={task._id}
                className="bg-bg-surface border border-border-subtle rounded-2xl p-6 shadow-lg mb-4"
            >
                {/* Card Header */}
                <div className="flex items-center space-x-3 mb-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: completedByMember?.profileColor || '#6B7280' }}
                    >
                        {completedByMember?.displayName?.charAt(0) || '?'}
                    </div>
                    <div>
                        <p className="text-lg font-bold text-text-primary">
                            {completedByMember?.displayName || 'Unknown'}
                        </p>
                        <p className="text-sm text-text-secondary">Completed a task</p>
                    </div>
                </div>

                {/* Task Details */}
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                        {task.title}
                    </h3>
                    {task.description && (
                        <p className="text-text-secondary mb-3">
                            {task.description}
                        </p>
                    )}

                    {/* Points Badge */}
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-action-primary/10 rounded-lg">
                        <Award className="w-4 h-4 text-action-primary" />
                        <span className="text-action-primary font-semibold">
                            {task.pointsValue} points
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={() => setConfirmRejectId(task._id)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-signal-alert text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                        <span>Reject</span>
                    </button>
                    <button
                        onClick={() => handleApprove(task._id)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-signal-success text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Approvals">
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <ConfirmModal
                isOpen={!!confirmRejectId}
                onClose={() => setConfirmRejectId(null)}
                onConfirm={handleReject}
                title="Reject Task"
                message="Are you sure you want to reject this task? The child will need to complete it again."
                confirmText="Reject"
                variant="danger"
            />

            <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Review and approve completed tasks
                </p>

                {pendingTasks.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                        {pendingTasks.map(task => renderApprovalCard(task))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <CheckCircle className="w-16 h-16 text-signal-success" />
                        <h3 className="text-2xl font-bold text-text-primary">
                            All Caught Up! 🎉
                        </h3>
                        <p className="text-text-secondary text-center">
                            No tasks waiting for approval
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ApprovalsModal;
