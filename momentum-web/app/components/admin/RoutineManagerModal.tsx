'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Edit2, Trash2, Calendar, Repeat } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import CreateRoutineModal from '../routines/CreateRoutineModal';
import EditRoutineModal from '../routines/EditRoutineModal';
import { IRoutine } from '../routines/RoutineList';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface RoutineManagerModalProps {
    onClose: () => void;
}

const RoutineManagerModal: React.FC<RoutineManagerModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { routines, members } = useFamilyData();

    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<IRoutine | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Modal States
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Filter and search routines
    const filteredRoutines = useMemo(() => {
        return routines
            .filter((routine) => {
                if (!searchQuery) return true;
                return routine.title.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [routines, searchQuery]);

    const handleDeleteRoutine = async () => {
        if (!confirmDeleteId) return;

        try {
            const response = await fetch(`/web-bff/routines/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete routine');
            }

            // Data will refresh via WebSocket
            setConfirmDeleteId(null);
            showAlert('Success', 'Routine deleted successfully', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('Error', 'Failed to delete routine', 'error');
        }
    };

    const renderRoutineItem = (routine: IRoutine) => {
        const assignedMember = members.find(m => m._id === routine.memberId);

        return (
            <div
                key={routine._id}
                className="bg-bg-surface border border-border-subtle rounded-xl p-4 hover:shadow-md transition-shadow"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-action-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-action-primary" />
                        </div>
                        <div>
                            <h4 className="text-text-primary font-semibold">
                                {routine.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <span className="flex items-center capitalize">
                                    <Repeat className="w-3 h-3 mr-1" />
                                    {routine.timeOfDay}
                                </span>
                                <span>•</span>
                                <span>{assignedMember?.displayName || 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                setEditingRoutine(routine);
                                setShowEditModal(true);
                            }}
                            className="p-2 text-text-secondary hover:text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(routine._id)}
                            className="p-2 text-text-secondary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="mt-3 pl-13">
                    {/* Description removed */}
                    <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs font-medium px-2 py-1 bg-bg-canvas rounded text-text-secondary border border-border-subtle">
                            {routine.items.length} items
                        </span>
                    </div>
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
                onConfirm={handleDeleteRoutine}
                title="Delete Routine"
                message="Are you sure you want to delete this routine? This cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            <Modal isOpen={true} onClose={onClose} title="Routine Manager">
                <div className="space-y-4">
                    {/* Header Actions */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Manage daily and weekly routines
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">New Routine</span>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search routines..."
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

                    {/* Routines List */}
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                        {filteredRoutines.length > 0 ? (
                            filteredRoutines.map(routine => renderRoutineItem(routine))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Calendar className="w-16 h-16 text-text-secondary" />
                                <h3 className="text-lg font-semibold text-text-secondary">
                                    {searchQuery ? 'No routines found' : 'No routines yet'}
                                </h3>
                                <p className="text-sm text-text-secondary text-center">
                                    Create a routine to help build good habits
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateRoutineModal
                    onClose={() => setShowCreateModal(false)}
                    onRoutineCreated={() => {
                        setShowCreateModal(false);
                        // Data will refresh via WebSocket
                    }}
                    members={members}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingRoutine && (
                <EditRoutineModal
                    routine={editingRoutine}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingRoutine(null);
                    }}
                    onRoutineUpdated={() => {
                        setShowEditModal(false);
                        setEditingRoutine(null);
                        // Data will refresh via WebSocket
                    }}
                    members={members}
                />
            )}
        </>
    );
};

export default RoutineManagerModal;
