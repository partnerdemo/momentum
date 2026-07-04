// =========================================================
// silkpanda/momentum/app/components/quests/QuestList.tsx
// List of available and active quests
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader, AlertTriangle } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import QuestItem from './QuestItem';
import CreateQuestModal from './CreateQuestModal';
import { IQuest, IHouseholdMemberProfile } from '../../types';

const QuestList: React.FC = () => {
    const { user, token } = useSession();
    const [quests, setQuests] = useState<IQuest[]>([]);
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'claimed' | 'completed' | 'approved'>('all');

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/web-bff/quests/page-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch quests');

            const data = await response.json();
            if (data.quests && data.memberProfiles) {
                setQuests(data.quests);
                setMembers(data.memberProfiles);
                setError(null);
            } else {
                throw new Error('Invalid data format received');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Helper to get status for current user
    const getCurrentUserProfileId = () => {
        if (!user || !members.length) return undefined;
        // Assuming familyMemberId is populated or matches user._id
        const profile = members.find(m => m.familyMemberId._id === user._id);
        return profile?._id;
    };

    const currentUserProfileId = getCurrentUserProfileId();

    const getQuestStatus = (quest: IQuest): string => {
        if (!currentUserProfileId) return 'active'; // Default to active/available if no user context

        const claim = quest.claims?.find(c => c.memberId === currentUserProfileId);
        if (claim) {
            // Map claim status to filter status
            // Claim statuses: 'claimed', 'completed', 'approved'
            return claim.status;
        }

        // If not claimed, check if it's available (active)
        // Ignoring maxClaims logic for simplicity in list view, or assumes backend returns valid quests
        return 'active';
    };

    const handleQuestCreated = (newQuest: IQuest) => {
        setQuests([newQuest, ...quests]);
    };

    const handleQuestUpdated = (updatedQuest: IQuest) => {
        setQuests(quests.map(q => q._id === updatedQuest._id ? updatedQuest : q));
    };

    const handleQuestDeleted = (questId: string) => {
        setQuests(quests.filter(q => q._id !== questId));
    };

    const filteredQuests = quests.filter(quest => {
        if (filter === 'all') return true;
        const status = getQuestStatus(quest);
        return status === filter;
    });

    if (loading && quests.length === 0) {
        return <div className="p-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-action-primary" /></div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-signal-alert/10 text-signal-alert rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Quests Board</h1>
                    <p className="text-text-secondary">Complete quests to earn extra points!</p>
                </div>

                {user?.role === 'Parent' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Quest
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {(['all', 'active', 'claimed', 'completed', 'approved'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors
                            ${filter === f
                                ? 'bg-action-primary text-white'
                                : 'bg-bg-surface text-text-secondary hover:bg-border-subtle'
                            }`}
                    >
                        {f === 'active' ? 'Available' : f}
                    </button>
                ))}
            </div>

            {/* Quest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuests.length > 0 ? (
                    filteredQuests.map((quest) => (
                        <QuestItem
                            key={quest._id}
                            quest={quest}
                            currentUserProfileId={currentUserProfileId}
                            onUpdate={handleQuestUpdated}
                            onDelete={handleQuestDeleted}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-surface rounded-xl border border-border-subtle border-dashed">
                        <div className="mx-auto w-12 h-12 bg-bg-canvas rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">No quests found</h3>
                        <p className="text-text-secondary">Try adjusting your filters or create a new quest.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <CreateQuestModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onQuestCreated={handleQuestCreated}
                />
            )}
        </div>
    );
};

export default QuestList;
