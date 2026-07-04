// =========================================================
// silkpanda/momentum/app/components/quests/QuestItem.tsx
// Individual Quest Card with Actions
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../layout/SessionContext';
import { IQuest } from '../../types';
import EditQuestModal from './EditQuestModal';
import QuestCard from '../shared/QuestCard';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface QuestItemProps {
    quest: IQuest;
    currentUserProfileId?: string;
    onUpdate: (quest: IQuest) => void;
    onDelete: (questId: string) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, currentUserProfileId, onUpdate, onDelete }) => {
    const { user, token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Modal States
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    const isParent = user?.role === 'Parent';

    // Helper to handle API calls
    const handleAction = async (action: 'claim' | 'complete' | 'approve' | 'delete') => {
        setIsLoading(true);
        try {
            let url = `/web-bff/quests/${quest._id}`;
            let method = 'POST';

            if (action === 'delete') {
                method = 'DELETE';
            } else {
                url += `/${action}`;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: action !== 'delete' ? JSON.stringify({ memberId: user?._id }) : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action} quest`);
            }

            if (action === 'delete') {
                onDelete(quest._id);
            } else {
                const data = await response.json();
                onUpdate(data.data.quest);
            }
        } catch (error: any) {
            console.error(`Error performing ${action}:`, error);
            showAlert('Error', `Failed to ${action} quest: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setIsLoading(false);
            if (action === 'delete') {
                setIsConfirmDeleteOpen(false);
            }
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

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={() => handleAction('delete')}
                title="Delete Quest"
                message={`Are you sure you want to delete "${quest.title}"? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

            <QuestCard
                quest={{
                    ...quest,
                    questType: quest.questType === 'one-time' ? 'one-time' : 'recurring',
                    status: ((): 'Available' | 'Active' | 'PendingApproval' | 'Completed' => {
                        const userClaim = quest.claims?.find(c => c.memberId === currentUserProfileId);
                        if (!userClaim) return 'Available';
                        if (userClaim.status === 'claimed') return 'Active';
                        if (userClaim.status === 'completed') return 'PendingApproval';
                        if (userClaim.status === 'approved') return 'Completed';
                        return 'Available';
                    })()
                } as any}
                isParent={isParent}
                isLoading={isLoading}
                onEdit={() => setIsEditModalOpen(true)}
                onDelete={() => setIsConfirmDeleteOpen(true)}
                onApprove={() => handleAction('approve')}
                onClaim={() => handleAction('claim')}
                onComplete={() => handleAction('complete')}
            />

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditQuestModal
                    quest={quest}
                    onClose={() => setIsEditModalOpen(false)}
                    onQuestUpdated={onUpdate}
                />
            )}
        </>
    );
};

export default QuestItem;
