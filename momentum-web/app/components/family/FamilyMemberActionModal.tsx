// =========================================================
// silkpanda/momentum/app/components/family/FamilyMemberActionModal.tsx
// New unified modal for the "Family View" page.
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Refactored to use useSession()
// hook instead of prop-drilling for the token.
// =========================================================
'use client';

import React, { useState } from 'react';
import { Award, CheckSquare, Loader, ShoppingCart, Gift, User } from 'lucide-react'; // Removed X, Package, CheckCircle, AlertTriangle
import { IHouseholdMemberProfile, ITask, IStoreItem } from '../../types';
import { useSession } from '../layout/SessionContext';
import Modal from '../shared/Modal';

// --- Props Interface ---
interface FamilyMemberActionModalProps {
    member: IHouseholdMemberProfile;
    allTasks: ITask[];
    allItems: IStoreItem[];
    onClose: () => void;
}

// ---  Reusable Task Row Component ---
const MemberTaskItem: React.FC<{
    task: ITask;
    onComplete: () => void;
    isCompleting: boolean;
}> = ({ task, onComplete, isCompleting }) => {
    const isPendingApproval = task.status === 'PendingApproval';

    return (
        <li className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-subtle min-h-[68px]">
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                    <Award className="w-4 h-4 text-action-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-text-primary">{task.title}</p>
                    <p className="text-xs text-text-secondary">{task.description || 'No description'}</p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
                <div className="text-right">
                    <p className="text-sm font-semibold text-signal-success">+{task.pointsValue}</p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>
                <div className="w-[140px] text-right flex justify-end">
                    {isCompleting ? (
                        <div className="flex items-center text-action-primary text-xs font-medium">
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                            Processing
                        </div>
                    ) : isPendingApproval ? (
                        <div className="flex items-center px-3 py-1.5 bg-bg-subtle text-text-tertiary rounded-lg text-xs font-medium border border-border-subtle">
                            <Loader className="w-3.5 h-3.5 mr-1.5" />
                            Pending
                        </div>
                    ) : (
                        <button
                            onClick={onComplete}
                            title={`Mark '${task.title}' complete`}
                            className="flex items-center px-3 py-1.5 bg-bg-canvas hover:bg-signal-success hover:text-white text-text-secondary border border-border-subtle hover:border-signal-success rounded-lg transition-all text-xs font-medium group"
                        >
                            <CheckSquare className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                            Complete
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
};

// --- Reusable Store Item Row Component ---
const MemberStoreItem: React.FC<{
    item: IStoreItem;
    onPurchase: () => void;
    canAfford: boolean;
    isPurchasing: boolean;
}> = ({ item, onPurchase, canAfford, isPurchasing }) => (
    <li className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-subtle">
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Gift className="w-4 h-4 text-action-primary" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary">{item.itemName}</p>
                <p className="text-xs text-text-secondary">{item.description || 'No description'}</p>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="text-right">
                <p className="text-sm font-semibold text-signal-success">{item.cost}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>
            <div className="w-10 text-right">
                {isPurchasing ? (
                    <Loader className="w-5 h-5 text-action-primary animate-spin" />
                ) : (
                    <button
                        onClick={onPurchase}
                        disabled={!canAfford}
                        title={canAfford ? "Purchase Item" : "Not enough points"}
                        className="p-2 text-text-secondary hover:text-signal-success transition-colors
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </li>
);

// --- Main Modal Component ---
const FamilyMemberActionModal: React.FC<FamilyMemberActionModalProps> = ({
    member, allTasks, allItems, onClose
}) => {

    // --- Shared State ---
    const [currentView, setCurrentView] = useState<'tasks' | 'store'>('tasks');
    const [currentPoints, setCurrentPoints] = useState(member.pointsTotal);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    // --- Task State ---
    const [tasks, setTasks] = useState(allTasks);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

    // --- Store State ---
    const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

    // --- Task Logic ---
    const handleMarkComplete = async (task: ITask) => {
        if (completingTaskId) return;
        setCompletingTaskId(task._id);
        setError(null);

        try {
            const response = await fetch(`/web-bff/tasks/${task._id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ memberId: member.familyMemberId._id }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to complete task.');
            }

            // Update local task state with returned data (which should have correct status)
            // API V3 standard response: { success: true, data: { task: { ... } } }
            const responseData = data.data || data;
            const updatedTaskData = responseData.task || responseData;

            setTasks(currentTasks =>
                currentTasks.map(t =>
                    t._id === task._id ? { ...t, ...updatedTaskData, isCompleted: updatedTaskData.isCompleted, status: updatedTaskData.status } : t
                )
            );

            // Only add points immediately if it was auto-approved (status is Approved or Completed)
            if (updatedTaskData.status === 'Approved' || updatedTaskData.isCompleted) {
                setCurrentPoints(prevPoints => prevPoints + task.pointsValue);
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setCompletingTaskId(null);
        }
    };

    const incompleteTasks = tasks.filter(task =>
        (!task.isCompleted || task.status === 'PendingApproval') && // Keep pending items visible
        task.assignedTo?.some(profile => profile._id === member.familyMemberId._id)
    );

    // --- Store Logic ---
    const handlePurchase = async (item: IStoreItem) => {
        if (purchasingItemId) return;
        if (currentPoints < item.cost) {
            setError("Not enough points.");
            return;
        }
        setPurchasingItemId(item._id);
        setError(null);

        try {
            const response = await fetch(`/web-bff/store/${item._id}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ memberId: member.familyMemberId._id }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to purchase item.');
            }
            setCurrentPoints(prevPoints => prevPoints - item.cost);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setPurchasingItemId(null);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={member.displayName}>
            {/* --- Header Summary --- */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                <div className="flex items-center space-x-3">
                    <div
                        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: member.profileColor || '#6B7280' }}
                    >
                        {member.role === 'Parent' ? <User className="w-6 h-6" /> : member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">{member.role}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-semibold text-action-primary">{currentPoints}</p>
                    <p className="text-xs text-text-secondary">Available Points</p>
                </div>
            </div>

            {/* --- Tabs --- */}
            <div className="flex items-center space-x-2 mb-4">
                <button
                    onClick={() => setCurrentView('tasks')}
                    className={`py-2 px-4 rounded-lg text-sm font-medium
                            ${currentView === 'tasks'
                            ? 'bg-action-primary text-white'
                            : 'bg-bg-surface text-text-secondary hover:bg-border-subtle'}`}
                >
                    Tasks ({incompleteTasks.length})
                </button>
                <button
                    onClick={() => setCurrentView('store')}
                    className={`py-2 px-4 rounded-lg text-sm font-medium
                            ${currentView === 'store'
                            ? 'bg-action-primary text-white'
                            : 'bg-bg-surface text-text-secondary hover:bg-border-subtle'}`}
                >
                    Store ({allItems.length})
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <p className="text-sm text-signal-alert mb-2 text-center">{error}</p>
            )}

            {/* --- Content Area --- */}
            <div className="flex-1 overflow-y-auto">
                {/* --- Tasks View --- */}
                {currentView === 'tasks' && (
                    <div>
                        {incompleteTasks.length > 0 ? (
                            <ul className="space-y-2">
                                {incompleteTasks.map(task => (
                                    <MemberTaskItem
                                        key={task._id}
                                        task={task}
                                        onComplete={() => handleMarkComplete(task)}
                                        isCompleting={completingTaskId === task._id}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary text-center p-8">
                                No assigned tasks.
                            </p>
                        )}
                    </div>
                )}

                {/* --- Store View --- */}
                {currentView === 'store' && (
                    <div>
                        {allItems.length > 0 ? (
                            <ul className="space-y-2">
                                {allItems.map(item => (
                                    <MemberStoreItem
                                        key={item._id}
                                        item={item}
                                        onPurchase={() => handlePurchase(item)}
                                        canAfford={currentPoints >= item.cost}
                                        isPurchasing={purchasingItemId === item._id}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-secondary text-center p-8">
                                No items in the store.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default FamilyMemberActionModal;