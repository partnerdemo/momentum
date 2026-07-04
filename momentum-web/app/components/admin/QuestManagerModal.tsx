'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Edit2, Trash2, CheckCircle, Filter, Zap } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import CreateQuestModal from '../quests/CreateQuestModal';
import EditQuestModal from '../quests/EditQuestModal';
import { IQuest } from '../../types';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface QuestManagerModalProps {
    onClose: () => void;
}

type FilterType = 'all' | 'active' | 'completed';

const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
];

const QuestManagerModal: React.FC<QuestManagerModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { quests, refresh } = useFamilyData();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
    const [editingQuest, setEditingQuest] = useState<IQuest | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Modal States
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmBatchDeleteOpen, setConfirmBatchDeleteOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Filter and search quests
    const filteredQuests = useMemo(() => {
        return quests
            .filter((quest: IQuest) => {
                // Apply status filter
                if (activeFilter === 'active') return quest.isActive;
                if (activeFilter === 'completed') return !quest.isActive; // Assuming !isActive means completed/archived
                return true;
            })
            .filter((quest: IQuest) => {
                // Apply search
                if (!searchQuery) return true;
                return quest.title.toLowerCase().includes(searchQuery.toLowerCase());
            });
    }, [quests, activeFilter, searchQuery]);

    const toggleQuestSelection = (questId: string) => {
        setSelectedQuests((prev) =>
            prev.includes(questId) ? prev.filter((id) => id !== questId) : [...prev, questId]
        );
    };

    const clearSelection = () => setSelectedQuests([]);

    const handleBatchDelete = async () => {
        if (selectedQuests.length === 0) return;

        try {
            await Promise.all(
                selectedQuests.map((id) =>
                    fetch(`/web-bff/quests/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            clearSelection();
            refresh();
            setConfirmBatchDeleteOpen(false);
            showAlert('Success', 'Quests deleted successfully', 'success');
        } catch (error) {
            console.error('Batch delete error:', error);
            showAlert('Error', 'Failed to delete some quests', 'error');
        }
    };

    const handleDeleteQuest = async () => {
        if (!confirmDeleteId) return;

        try {
            await fetch(`/web-bff/quests/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            refresh();
            setConfirmDeleteId(null);
            // Optionally show success, but refresh handles UI update
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('Error', 'Failed to delete quest', 'error');
        }
    };

    const renderQuest = (quest: IQuest) => {
        const isSelected = selectedQuests.includes(quest._id);

        return (
            <div
                key={quest._id}
                className={`flex items-center space-x-3 py-3 border-b border-border-subtle ${isSelected ? 'bg-action-primary/10' : ''
                    }`}
            >
                {/* Checkbox */}
                <button
                    onClick={() => toggleQuestSelection(quest._id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                        ? 'bg-action-primary border-action-primary'
                        : 'border-border-subtle hover:border-action-primary'
                        }`}
                >
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                {/* Quest Info */}
                <div className="flex-1 text-left">
                    <p className="text-text-primary font-semibold">{quest.title}</p>
                    <p className="text-sm text-text-secondary">
                        {quest.pointsValue} pts • {quest.claims?.length || 0} claims
                    </p>
                </div>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-lg text-white text-xs font-semibold ${quest.isActive ? 'bg-action-primary' : 'bg-text-tertiary'}`}>
                    {quest.isActive ? 'Active' : 'Inactive'}
                </span>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                    {/* Edit Button */}
                    <button
                        onClick={() => {
                            setEditingQuest(quest);
                            setShowEditModal(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-action-primary rounded-lg hover:bg-action-hover transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={() => setConfirmDeleteId(quest._id)}
                        className="w-8 h-8 flex items-center justify-center bg-signal-alert rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        );
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
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDeleteQuest}
                title="Delete Quest"
                message="Are you sure you want to delete this quest?"
                confirmText="Delete"
                variant="danger"
            />

            <ConfirmModal
                isOpen={confirmBatchDeleteOpen}
                onClose={() => setConfirmBatchDeleteOpen(false)}
                onConfirm={handleBatchDelete}
                title="Delete Quests"
                message={`Are you sure you want to delete ${selectedQuests.length} quest(s)?`}
                confirmText="Delete All"
                variant="danger"
            />

            <Modal isOpen={true} onClose={onClose} title="Quest Manager">
                <div className="space-y-4">
                    {/* Header Actions */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Manage quests and challenges
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">New</span>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search quests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary focus:ring-2 focus:ring-action-primary focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filter.id
                                    ? 'bg-action-primary text-white'
                                    : 'bg-bg-canvas text-text-primary border border-border-subtle hover:bg-border-subtle'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Batch Actions Bar */}
                    {selectedQuests.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-action-primary rounded-lg">
                            <span className="text-white font-semibold">{selectedQuests.length} selected</span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setConfirmBatchDeleteOpen(true)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-signal-alert rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                    <span className="text-white text-sm font-semibold">Delete</span>
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quest List */}
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                        {filteredQuests.length > 0 ? (
                            <div>
                                {filteredQuests.map(quest => renderQuest(quest))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Zap className="w-16 h-16 text-border-subtle" />
                                <h3 className="text-lg font-semibold text-text-primary">
                                    {searchQuery ? 'No quests match your search' : 'No quests found'}
                                </h3>
                                <p className="text-sm text-text-secondary text-center">
                                    {searchQuery
                                        ? 'Try adjusting your search or filters'
                                        : 'Create a new quest to get started'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateQuestModal
                    onClose={() => setShowCreateModal(false)}
                    onQuestCreated={() => {
                        setShowCreateModal(false);
                        refresh();
                    }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingQuest && (
                <EditQuestModal
                    quest={editingQuest}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingQuest(null);
                    }}
                    onQuestUpdated={() => {
                        setShowEditModal(false);
                        setEditingQuest(null);
                        refresh();
                    }}
                />
            )}
        </>
    );
};

export default QuestManagerModal;
