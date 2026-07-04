// =========================================================
// silkpanda/momentum/app/components/routines/RoutineItem.tsx
// Individual Routine Card
// =========================================================
'use client';

import React, { useState } from 'react';
import { Check, Trash, Clock, Calendar, Award, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IRoutine } from './RoutineList';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import EditRoutineModal from './EditRoutineModal';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface RoutineItemProps {
    routine: IRoutine;
    onUpdate: (routine: IRoutine) => void;
    onDelete: (routineId: string) => void;
}

const RoutineItem: React.FC<RoutineItemProps> = ({ routine, onUpdate, onDelete }) => {
    const { user, token } = useSession();
    const { members } = useFamilyData();
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Modal States
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const isParent = user?.role === 'Parent';
    const isAssignedToMe = routine.memberId === user?._id;

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Helper to handle API calls
    const handleAction = async (action: 'complete' | 'delete') => {
        setIsLoading(true);
        try {
            let url = `/web-bff/routines/${routine._id}`;
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
                throw new Error(errorData.message || `Failed to ${action} routine`);
            }

            if (action === 'delete') {
                setIsDeleteConfirmOpen(false);
                onDelete(routine._id);
            } else {
                // For completion, we might just get a success message and points
                // We can optimistically update or refetch.
                // The API returns data: { pointsAwarded, newTotal }
                // It doesn't return the updated routine object usually, unless we change it.
                // Let's assume for now we just alert success.
                showAlert('Success', 'Routine completed! Points awarded.', 'success');
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            showAlert('Error', `Failed to ${action} routine. Please try again.`, 'error');
        } finally {
            setIsLoading(false);
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
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={() => handleAction('delete')}
                title="Delete Routine"
                message="Are you sure you want to delete this routine? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            <div className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-5 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-text-primary line-clamp-1">{routine.title}</h3>
                                <div className="flex items-center text-xs text-text-secondary mt-0.5">
                                    <Clock className="w-3 h-3 mr-1 text-brand-secondary" />
                                    <span className="capitalize">{routine.timeOfDay}</span>
                                </div>
                            </div>
                        </div>
                        {isParent && (
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    disabled={isLoading}
                                    className="p-1.5 text-text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                    title="Edit Routine"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                    disabled={isLoading}
                                    className="p-1.5 text-text-tertiary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors"
                                    title="Delete Routine"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Description removed as not in backend model */}

                    {/* Steps Preview / Expansion */}
                    <div className="border-t border-border-subtle pt-3">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-between w-full text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <span>{routine.items.length} Steps</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                            <ul className="mt-3 space-y-2">
                                {routine.items.map((step, index) => (
                                    <li key={index} className="flex items-start text-sm text-text-primary">
                                        <div className="mt-0.5 mr-2 w-4 h-4 rounded-full border border-border-subtle flex-shrink-0" />
                                        <span>{step.title}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Complete Action */}
                {isAssignedToMe && (
                    <div className="mt-5">
                        <button
                            onClick={() => handleAction('complete')}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-4 py-2.5 bg-action-primary text-white text-sm font-medium rounded-lg hover:bg-action-hover transition-colors shadow-sm"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Complete Routine
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditRoutineModal
                    routine={routine}
                    onClose={() => setIsEditModalOpen(false)}
                    onRoutineUpdated={onUpdate}
                    members={members}
                />
            )}
        </>
    );
};

export default RoutineItem;
