'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../layout/SessionContext';
import { CheckCircle, Clock, Target, Map as MapIcon, Loader } from 'lucide-react';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { SOCKET_EVENTS } from '../../../lib/socket';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

// --- Types ---

interface IApprovalTask {
    _id: string;
    title: string;
    pointsValue: number;
    status: string;
    assignedTo: {
        _id: string;
        displayName: string;
        profileColor?: string;
    }[];
}

interface IApprovalQuest {
    _id: string;
    title: string;
    pointsValue: number;
    claims: {
        memberId: string;
        status: string;
        completedAt?: string;
    }[];
}

interface IMember {
    _id: string;
    displayName: string;
    profileColor?: string;
}

export default function ApprovalsDashboard() {
    const { token } = useSession();
    const [tasks, setTasks] = useState<IApprovalTask[]>([]);
    const [quests, setQuests] = useState<IApprovalQuest[]>([]);
    const [members, setMembers] = useState<IMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal States
    const [confirmRejectTaskId, setConfirmRejectTaskId] = useState<string | null>(null);
    const [confirmRejectQuest, setConfirmRejectQuest] = useState<{ questId: string, memberId: string } | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // --- Data Fetching ---

    const fetchData = useCallback(async () => {
        if (!token) return;

        try {
            setError(null);
            // Fetch Tasks
            const tasksRes = await fetch('/web-bff/tasks/page-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tasksData = await tasksRes.json();

            // Fetch Quests
            const questsRes = await fetch('/web-bff/quests/page-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const questsData = await questsRes.json();

            // Process Tasks
            if (tasksData.tasks) {
                const pending = tasksData.tasks.filter((t: IApprovalTask) => t.status === 'PendingApproval');
                setTasks(pending);
            }

            // Process Quests
            if (questsData.quests) {
                const pending = questsData.quests.filter((q: IApprovalQuest) =>
                    q.claims && q.claims.some(c => c.status === 'completed')
                );
                setQuests(pending);
            }

            // Store Members for lookup
            if (tasksData.householdMembers) {
                setMembers(tasksData.householdMembers);
            }

        } catch (err) {
            console.error('Error fetching approvals:', err);
            setError('Failed to load approvals data');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Real-time Updates ---

    useSocketEvent(SOCKET_EVENTS.TASK_UPDATED, () => {
        console.log('🔄 Task updated, refreshing approvals...');
        fetchData();
    });

    useSocketEvent(SOCKET_EVENTS.QUEST_UPDATED, () => {
        console.log('🔄 Quest updated, refreshing approvals...');
        fetchData();
    });

    // --- Actions ---

    const handleApproveTask = async (taskId: string) => {
        try {
            const res = await fetch(`/web-bff/tasks/${taskId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to approve task');
            }
            fetchData();
            // showAlert('Success', 'Task approved!', 'success'); // Optional success feedback
        } catch (err: any) {
            console.error(err);
            showAlert('Error', `Failed to approve task: ${err.message}`, 'error');
        }
    };

    const handleRejectTask = async () => {
        if (!confirmRejectTaskId) return;

        try {
            const res = await fetch(`/web-bff/tasks/${confirmRejectTaskId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Pending', completedBy: null })
            });

            if (!res.ok) throw new Error('Failed to reject task');
            setConfirmRejectTaskId(null);
            fetchData();
            showAlert('Success', 'Task rejected', 'success');
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to reject task', 'error');
        }
    };

    const handleApproveQuest = async (questId: string, memberId: string) => {
        const quest = quests.find(q => q._id === questId);
        if (!quest) return;

        const updatedClaims = quest.claims.map(c =>
            c.memberId === memberId ? { ...c, status: 'approved' } : c
        );

        try {
            const res = await fetch(`/web-bff/quests/${questId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ claims: updatedClaims })
            });

            if (!res.ok) throw new Error('Failed to approve quest');
            fetchData();
            // showAlert('Success', 'Quest approved!', 'success');
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to approve quest', 'error');
        }
    };

    const handleRejectQuest = async () => {
        if (!confirmRejectQuest) return;
        const { questId, memberId } = confirmRejectQuest;

        const quest = quests.find(q => q._id === questId);
        if (!quest) return;

        const updatedClaims = quest.claims.map(c =>
            c.memberId === memberId ? { ...c, status: 'claimed', completedAt: undefined } : c
        );

        try {
            const res = await fetch(`/web-bff/quests/${questId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ claims: updatedClaims })
            });

            if (!res.ok) throw new Error('Failed to reject quest');
            setConfirmRejectQuest(null);
            fetchData();
            showAlert('Success', 'Quest rejected', 'success');
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to reject quest', 'error');
        }
    };

    // --- Render ---

    if (isLoading) return <div className="flex justify-center p-12"><Loader className="w-8 h-8 animate-spin text-action-primary" /></div>;
    if (error) return <div className="text-signal-alert text-center p-8">{error}</div>;

    const hasApprovals = tasks.length > 0 || quests.length > 0;

    return (
        <div className="max-w-4xl mx-auto">
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <ConfirmModal
                isOpen={!!confirmRejectTaskId}
                onClose={() => setConfirmRejectTaskId(null)}
                onConfirm={handleRejectTask}
                title="Reject Task"
                message="Reject this task? The child will need to complete it again."
                confirmText="Reject"
                variant="danger"
            />

            <ConfirmModal
                isOpen={!!confirmRejectQuest}
                onClose={() => setConfirmRejectQuest(null)}
                onConfirm={handleRejectQuest}
                title="Reject Quest"
                message="Reject this quest? The member will need to complete it again."
                confirmText="Reject"
                variant="danger"
            />

            <div className="mb-8">
                <h2 className="text-3xl font-semibold text-text-primary mb-2">Approvals Dashboard</h2>
                <p className="text-text-secondary">Review and approve completed tasks and quests.</p>
            </div>

            {!hasApprovals ? (
                <div className="bg-bg-surface rounded-xl p-12 text-center border border-border-subtle border-dashed">
                    <CheckCircle className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-text-primary mb-2">All Caught Up!</h3>
                    <p className="text-text-secondary">No pending approvals found.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Tasks Section */}
                    {tasks.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                <Target className="w-5 h-5" /> Pending Tasks
                            </h3>
                            {tasks.map(task => (
                                <div key={task._id} className="bg-bg-surface p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-bg-canvas text-text-secondary text-xs font-bold rounded uppercase">Task</span>
                                            <h4 className="text-lg font-semibold text-text-primary">{task.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <span className="text-action-primary font-bold">+{task.pointsValue} pts</span>
                                            <span className="flex items-center gap-1 text-signal-warning">
                                                <Clock className="w-3 h-3" /> Pending Approval
                                            </span>
                                            {task.assignedTo.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    by {task.assignedTo.map(m => m.displayName).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => setConfirmRejectTaskId(task._id)}
                                            className="flex-1 sm:flex-none px-4 py-2 border border-signal-alert text-signal-alert rounded-lg hover:bg-signal-alert/5 transition-colors font-medium"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApproveTask(task._id)}
                                            className="flex-1 sm:flex-none px-6 py-2 bg-signal-success text-white rounded-lg hover:bg-signal-success/90 transition-colors font-medium shadow-sm"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quests Section */}
                    {quests.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                <MapIcon className="w-5 h-5" /> Pending Quests
                            </h3>
                            {quests.map(quest => {
                                // Find the pending claim(s)
                                const pendingClaims = quest.claims.filter(c => c.status === 'completed');

                                return pendingClaims.map((claim, idx) => {
                                    const member = members.find(m => m._id === claim.memberId);
                                    const memberName = member ? member.displayName : 'Unknown Member';

                                    return (
                                        <div key={`${quest._id}-${claim.memberId}-${idx}`} className="bg-bg-surface p-6 rounded-xl shadow-sm border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-bg-canvas text-text-secondary text-xs font-bold rounded uppercase">Quest</span>
                                                    <h4 className="text-lg font-semibold text-text-primary">{quest.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                    <span className="text-action-primary font-bold">+{quest.pointsValue} pts</span>
                                                    <span className="flex items-center gap-1 text-signal-warning">
                                                        <Clock className="w-3 h-3" /> Pending Approval
                                                    </span>
                                                    <span>by <strong>{memberName}</strong></span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <button
                                                    onClick={() => setConfirmRejectQuest({ questId: quest._id, memberId: claim.memberId })}
                                                    className="flex-1 sm:flex-none px-4 py-2 border border-signal-alert text-signal-alert rounded-lg hover:bg-signal-alert/5 transition-colors font-medium"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleApproveQuest(quest._id, claim.memberId)}
                                                    className="flex-1 sm:flex-none px-6 py-2 bg-signal-success text-white rounded-lg hover:bg-signal-success/90 transition-colors font-medium shadow-sm"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
