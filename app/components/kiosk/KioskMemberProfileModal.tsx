// =========================================================
// momentum-web/app/components/kiosk/KioskMemberProfileModal.tsx
// Member Profile View Modal for Kiosk
// Tabs: Tasks, Points & Store, Profile
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem } from '../../types';
import { X, CheckSquare, Award, User, Loader, Gift, ChevronRight, Target, Play, Clock } from 'lucide-react';
import FocusModeView from '../focus/FocusModeView';
import AlertModal from '../shared/AlertModal';

interface KioskMemberProfileModalProps {
    member: IHouseholdMemberProfile;
    allTasks: ITask[];
    allItems: IStoreItem[];
    onClose: () => void;
    onRefresh: () => Promise<void>;
    onUpdateTask: (taskId: string, updates: Partial<ITask>) => void;
}

type TabType = 'tasks' | 'store' | 'profile';

const KioskMemberProfileModal: React.FC<KioskMemberProfileModalProps> = ({
    member,
    allTasks,
    allItems,
    onClose,
    onRefresh,
    onUpdateTask,
}) => {
    const { token } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFocusModeActive, setIsFocusModeActive] = useState(false);

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant?: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // No longer need submittedTaskIds local state as we update global state optimistically

    // ... existing filters ...
    const memberTasks = allTasks.filter(task =>
        task.status !== 'Approved' && // Show pending
        task.assignedTo?.some(assignee => assignee._id === member._id)
    );

    // ... (focus task logic remains same)

    const focusedTask = member.focusedTaskId
        ? memberTasks.find(t => t._id === member.focusedTaskId)
        : undefined;

    const affordableItems = allItems.filter(item => item.cost <= member.pointsTotal);
    const futureItems = allItems.filter(item => item.cost > member.pointsTotal);

    const handleCompleteTask = async (taskId: string) => {
        if (completingTaskId) return;

        setCompletingTaskId(taskId);
        setError(null);

        try {
            // Optimistic update - immediately mark as pending/completed in UI
            // This will cause the tasks list to re-render immediately if logic filters it differently
            // But usually we want to see it change state.
            // If we set status='PendingApproval', it stays in list but button changes state.
            onUpdateTask(taskId, { status: 'PendingApproval' });

            const response = await fetch(`/web-bff/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ memberId: member._id }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Revert if failed
                onRefresh();
                throw new Error(data.message || 'Failed to complete task');
            }

            // Manual silent refresh for consistency
            await onRefresh();

            // Show success feedback
            showAlert('Great Job!', 'Task submitted for approval!', 'success');

        } catch (e: any) {
            setError(e.message);
        } finally {
            setCompletingTaskId(null);
        }
    };

    // Handle reward request
    const handleRequestReward = async (itemId: string) => {
        if (purchasingItemId) return;
        setPurchasingItemId(itemId);

        try {
            const response = await fetch(`/web-bff/store/${itemId}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ memberId: member.familyMemberId._id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to purchase item');
            }

            // Success feedback
            showAlert('Reward Redeemed!', `You purchased the item successfully!`, 'success');

            // Refresh data (points deduction)
            await onRefresh();

        } catch (e: any) {
            showAlert('Purchase Failed', e.message, 'error');
        } finally {
            setPurchasingItemId(null);
        }
    };

    // ... TabButton ...
    const TabButton: React.FC<{ tab: TabType; icon: React.ElementType; label: string }> = ({
        tab,
        icon: Icon,
        label,
    }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab
                ? 'bg-action-primary text-white shadow-lg'
                : 'bg-bg-canvas text-text-secondary hover:bg-border-subtle'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <>
            {isFocusModeActive && focusedTask && (
                <FocusModeView
                    task={focusedTask}
                    onComplete={async () => {
                        await handleCompleteTask(focusedTask._id);
                        setIsFocusModeActive(false);
                    }}
                    onExit={() => setIsFocusModeActive(false)}
                />
            )}

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                {/* ... rest of the modal content same as before ... */}
                <div className="bg-bg-surface rounded-2xl shadow-2xl border border-border-subtle max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                        <div className="flex items-center space-x-4">
                            {/* Avatar */}
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                                style={{ backgroundColor: member.profileColor || '#6B7280' }}
                            >
                                {member.role === 'Parent' ? (
                                    <User className="w-8 h-8" />
                                ) : (
                                    member.displayName.charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* Name & Points */}
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary">
                                    {member.displayName}
                                </h2>
                                <p className="text-lg text-action-primary font-semibold">
                                    {member.pointsTotal} Points
                                </p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-text-secondary hover:text-signal-alert hover:bg-signal-alert/10 transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center space-x-2 px-6 py-4 bg-bg-canvas border-b border-border-subtle">
                        <TabButton tab="tasks" icon={CheckSquare} label="Tasks" />
                        <TabButton tab="store" icon={Gift} label="Rewards" />
                        <TabButton tab="profile" icon={User} label="Profile" />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-signal-alert/10 text-signal-alert rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* TASKS TAB */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-text-primary mb-4">
                                    Assigned Tasks ({memberTasks.length})
                                </h3>

                                {/* Focused Task Banner */}
                                {focusedTask && (
                                    <div className="mb-6 p-1 bg-gradient-to-r from-action-primary to-purple-600 rounded-xl shadow-lg">
                                        <div className="bg-bg-surface rounded-lg p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-action-primary/10 rounded-lg">
                                                        <Target className="w-6 h-6 text-action-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-action-primary uppercase tracking-wider">Current Focus</p>
                                                        <h4 className="text-xl font-bold text-text-primary">{focusedTask.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-signal-success/10 text-signal-success rounded-full text-sm font-bold">
                                                    +{focusedTask.pointsValue} pts
                                                </div>
                                            </div>

                                            {focusedTask.description && (
                                                <p className="text-text-secondary mb-5 line-clamp-2">
                                                    {focusedTask.description}
                                                </p>
                                            )}

                                            <button
                                                onClick={() => setIsFocusModeActive(true)}
                                                className="w-full py-3 bg-action-primary text-white rounded-lg font-bold text-lg shadow-md 
                                                     hover:bg-action-hover hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                                            >
                                                <Play className="w-5 h-5 fill-current" />
                                                <span>Start Focus Session</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {memberTasks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckSquare className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
                                        <p className="text-text-secondary text-lg">
                                            No tasks assigned. Great job! 🎉
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {memberTasks.map((task) => (
                                            <div
                                                key={task._id}
                                                className="flex items-center justify-between p-4 bg-bg-canvas rounded-lg border border-border-subtle hover:border-action-primary transition-all"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-medium text-text-primary mb-1">
                                                        {task.title}
                                                    </h4>
                                                    {task.description && (
                                                        <p className="text-sm text-text-secondary">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    <p className="text-sm font-semibold text-signal-success mt-2">
                                                        +{task.pointsValue} Points
                                                    </p>
                                                </div>

                                                {/* Complete Button */}
                                                <button
                                                    onClick={() => handleCompleteTask(task._id)}
                                                    disabled={completingTaskId === task._id || task.status === 'PendingApproval'}
                                                    className={`ml-4 px-6 py-3 rounded-lg font-medium 
                                                         flex items-center space-x-2 transition-all shadow-md hover:shadow-lg
                                                         ${task.status === 'PendingApproval'
                                                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 cursor-default shadow-none'
                                                            : 'bg-signal-success text-white hover:bg-signal-success/90 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                >
                                                    {completingTaskId === task._id ? (
                                                        <>
                                                            <Loader className="w-5 h-5 animate-spin" />
                                                            <span>Completing...</span>
                                                        </>
                                                    ) : task.status === 'PendingApproval' ? (
                                                        <>
                                                            <Clock className="w-5 h-5" />
                                                            <span>Pending Approval</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckSquare className="w-5 h-5" />
                                                            <span>Complete</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STORE TAB */}
                        {activeTab === 'store' && (
                            <div className="space-y-6">
                                {/* Affordable Rewards */}
                                <div>
                                    <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                                        <Gift className="w-6 h-6 mr-2 text-signal-success" />
                                        Available Now ({affordableItems.length})
                                    </h3>

                                    {affordableItems.length === 0 ? (
                                        <p className="text-text-secondary text-center py-8">
                                            No rewards available yet. Complete tasks to earn points!
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {affordableItems.map((item) => (
                                                <div
                                                    key={item._id}
                                                    className="p-4 bg-bg-canvas rounded-lg border-2 border-signal-success/30 hover:border-signal-success transition-all"
                                                >
                                                    <h4 className="text-lg font-medium text-text-primary mb-2">
                                                        {item.itemName}
                                                    </h4>
                                                    {item.description && (
                                                        <p className="text-sm text-text-secondary mb-3">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl font-bold text-action-primary">
                                                            {item.cost} Points
                                                        </span>
                                                        <button
                                                            onClick={() => handleRequestReward(item._id)}
                                                            disabled={purchasingItemId === item._id}
                                                            className="px-4 py-2 bg-signal-success text-white rounded-lg font-medium 
                                                                 hover:bg-signal-success/90 transition-all flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {purchasingItemId === item._id ? (
                                                                <>
                                                                    <Loader className="w-4 h-4 animate-spin" />
                                                                    <span>...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span>Redeem</span>
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Future Rewards */}
                                {futureItems.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center">
                                            <Award className="w-6 h-6 mr-2 text-text-secondary" />
                                            Save Up For ({futureItems.length})
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {futureItems.map((item) => (
                                                <div
                                                    key={item._id}
                                                    className="p-4 bg-bg-canvas rounded-lg border border-border-subtle opacity-75"
                                                >
                                                    <h4 className="text-lg font-medium text-text-primary mb-2">
                                                        {item.itemName}
                                                    </h4>
                                                    {item.description && (
                                                        <p className="text-sm text-text-secondary mb-3">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xl font-bold text-text-secondary">
                                                            {item.cost} Points
                                                        </span>
                                                        <span className="text-sm text-text-secondary">
                                                            Need {item.cost - member.pointsTotal} more
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-text-primary mb-4">
                                    Profile Information
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-bg-canvas rounded-lg border border-border-subtle">
                                        <p className="text-sm text-text-secondary mb-1">Display Name</p>
                                        <p className="text-lg font-medium text-text-primary">
                                            {member.displayName}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-bg-canvas rounded-lg border border-border-subtle">
                                        <p className="text-sm text-text-secondary mb-1">Role</p>
                                        <p className="text-lg font-medium text-text-primary">
                                            {member.role}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-bg-canvas rounded-lg border border-border-subtle">
                                        <p className="text-sm text-text-secondary mb-2">Profile Color</p>
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-12 h-12 rounded-lg shadow-md"
                                                style={{ backgroundColor: member.profileColor || '#6B7280' }}
                                            />
                                            <p className="text-sm font-mono text-text-primary">
                                                {member.profileColor || '#6B7280'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-bg-canvas rounded-lg border border-border-subtle">
                                        <p className="text-sm text-text-secondary mb-1">Total Points Earned</p>
                                        <p className="text-3xl font-bold text-action-primary">
                                            {member.pointsTotal}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default KioskMemberProfileModal;
