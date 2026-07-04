'use client';

import React, { useState } from 'react';
import { Target, CheckCircle, DollarSign, Zap, TrendingUp, X, Edit2 } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import { IHouseholdMemberProfile } from '../../types';
import EditMemberModal from './EditMemberModal';
import AlertModal from '../shared/AlertModal';

interface MemberDetailModalProps {
    member: IHouseholdMemberProfile;
    onClose: () => void;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose }) => {
    const { token, householdId } = useSession();
    const { tasks } = useFamilyData();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Modal States
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Get member's tasks
    const memberTasks = tasks.filter((t) =>
        t.assignedTo.some(a => a._id === member._id || a._id === member.familyMemberId?._id)
    );
    const activeTasks = memberTasks.filter((t) => t.status === 'Pending');
    const focusTask = member.focusedTaskId
        ? tasks.find((t) => t._id === member.focusedTaskId)
        : null;

    const handleSetFocus = async (taskId: string) => {
        if (!householdId || isProcessing) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/web-bff/members/${member._id}/focus`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId })
            });

            if (!response.ok) {
                throw new Error('Failed to set focus task');
            }

            showAlert('Success', 'Focus task has been set!', 'success');
        } catch (error) {
            console.error('Set focus error:', error);
            showAlert('Error', 'Failed to set focus task', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearFocus = async () => {
        if (!householdId || isProcessing) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/web-bff/members/${member._id}/focus`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to clear focus');
            }

            showAlert('Success', 'Focus mode has been cleared', 'success');
        } catch (error) {
            console.error('Clear focus error:', error);
            showAlert('Error', 'Failed to clear focus', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <Modal isOpen={true} onClose={onClose} title={`${member.displayName}'s Profile`}>
                <div className="space-y-6">
                    {/* Member Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                                style={{ backgroundColor: member.profileColor || '#6B7280' }}
                            >
                                {member.displayName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-text-primary">
                                    {member.displayName}
                                </h3>
                                <p className="text-text-secondary">{member.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2 text-text-secondary hover:text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-bg-surface p-4 rounded-xl text-center space-y-2">
                            <DollarSign className="w-6 h-6 mx-auto text-action-primary" />
                            <p className="text-2xl font-bold text-text-primary">
                                {member.pointsTotal || 0}
                            </p>
                            <p className="text-xs text-text-secondary">Total Points</p>
                        </div>

                        <div className="bg-bg-surface p-4 rounded-xl text-center space-y-2">
                            <CheckCircle className="w-6 h-6 mx-auto text-signal-success" />
                            <p className="text-2xl font-bold text-text-primary">
                                {activeTasks.length}
                            </p>
                            <p className="text-xs text-text-secondary">Active Tasks</p>
                        </div>

                        <div className="bg-bg-surface p-4 rounded-xl text-center space-y-2">
                            <TrendingUp className="w-6 h-6 mx-auto text-blue-500" />
                            <p className="text-2xl font-bold text-text-primary">
                                0
                            </p>
                            <p className="text-xs text-text-secondary">Day Streak</p>
                        </div>
                    </div>

                    {/* Focus Mode Section */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-action-primary" />
                            <h4 className="text-lg font-bold text-text-primary">Focus Mode</h4>
                        </div>

                        {focusTask ? (
                            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-4 space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Target className="w-5 h-5 text-yellow-600" />
                                    <p className="font-bold text-yellow-900 flex-1">
                                        {focusTask.title}
                                    </p>
                                </div>
                                {focusTask.description && (
                                    <p className="text-sm text-yellow-800">
                                        {focusTask.description}
                                    </p>
                                )}
                                <button
                                    onClick={handleClearFocus}
                                    disabled={isProcessing}
                                    className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
                                >
                                    Clear Focus
                                </button>
                            </div>
                        ) : (
                            <div className="bg-bg-surface p-5 rounded-xl text-center space-y-2">
                                <p className="text-text-secondary font-semibold">
                                    No focus task set
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Select a task below to set as focus
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Active Tasks Section */}
                    <div className="space-y-3">
                        <h4 className="text-lg font-bold text-text-primary">
                            Active Tasks ({activeTasks.length})
                        </h4>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {activeTasks.length > 0 ? (
                                activeTasks.map((task) => (
                                    <button
                                        key={task._id}
                                        onClick={() => handleSetFocus(task._id)}
                                        disabled={isProcessing || task._id === member.focusedTaskId}
                                        className={`w-full flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl transition-all ${task._id === member.focusedTaskId
                                            ? 'opacity-75 cursor-not-allowed'
                                            : 'hover:shadow-md'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <p className="text-text-primary font-semibold">
                                                {task.title}
                                            </p>
                                            <p className="text-sm text-action-primary font-semibold">
                                                {task.pointsValue} pts
                                            </p>
                                        </div>
                                        {task._id === member.focusedTaskId && (
                                            <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-500 rounded-full">
                                                <Zap className="w-3 h-3 text-white" />
                                                <span className="text-xs font-semibold text-white">
                                                    Focused
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-text-secondary py-8">
                                    No active tasks
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {isEditModalOpen && (
                <EditMemberModal
                    member={member}
                    onClose={() => setIsEditModalOpen(false)}
                    onMemberUpdated={() => {
                        setIsEditModalOpen(false);
                        // Data will refresh via WebSocket
                    }}
                    onMemberDeleted={() => {
                        setIsEditModalOpen(false);
                        onClose(); // Close detail modal too
                    }}
                />
            )}
        </>
    );
};

export default MemberDetailModal;
