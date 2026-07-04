// =========================================================
// silkpanda/momentum/app/components/tasks/EditTaskModal.tsx
// REFACTORED: Add defensive null check for task assignments
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Modified onTaskUpdated to return
// the updated task object for optimistic state updates.
// =========================================================
'use client';

import React, { useState } from 'react';
import { Award, Check, Loader, Type, AlertTriangle, UserCheck } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { ITask, IHouseholdMemberProfile } from '../../types';
import Modal from '../shared/Modal';

interface EditTaskModalProps {
    task: ITask;
    onClose: () => void;
    onTaskUpdated: (updatedTask: ITask) => void;
    householdMembers: IHouseholdMemberProfile[];
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
    task, onClose, onTaskUpdated, householdMembers
}) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [pointsValue, setPointsValue] = useState(task.pointsValue);

    const [assignedTo, setAssignedTo] = useState<string[]>(() => {
        if (!task.assignedTo || task.assignedTo.length === 0) return [];

        const assignedIds: string[] = [];
        task.assignedTo.forEach(assignedMember => {
            if (assignedMember._id) {
                const match = householdMembers.find(hm => hm._id === assignedMember._id);
                if (match) {
                    assignedIds.push(match._id);
                    return;
                }
            }
            const match = householdMembers.find(hm => hm.displayName === assignedMember.displayName);
            if (match) {
                assignedIds.push(match._id);
            }
        });
        return Array.from(new Set(assignedIds));
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() === '') {
            setError('Task Title is required.');
            return;
        }
        if (pointsValue < 1) {
            setError('Points must be at least 1.');
            return;
        }
        if (assignedTo.length === 0) {
            setError('Please assign the task to at least one member.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/web-bff/tasks/${task._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    pointsValue,
                    assignedTo: assignedTo,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update task.');
            }

            onTaskUpdated(data.data.task);
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAssignment = (memberProfile: IHouseholdMemberProfile) => {
        const memberRefId = memberProfile._id;

        setAssignedTo(prevIds => {
            if (prevIds.includes(memberRefId)) {
                return prevIds.filter(id => id !== memberRefId);
            } else {
                return [...prevIds, memberRefId];
            }
        });
    };

    const isMemberAssigned = (memberProfile: IHouseholdMemberProfile) => {
        return assignedTo.includes(memberProfile._id);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Edit Task">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">

                {/* Task Title Input */}
                <div className="space-y-1">
                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary">
                        Task Title
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Type className="h-5 w-5 text-text-secondary" />
                        </div>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                        />
                    </div>
                </div>

                {/* Points Value Input */}
                <div className="space-y-1">
                    <label htmlFor="pointsValue" className="block text-sm font-medium text-text-secondary">
                        Points Value
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Award className="h-5 w-5 text-text-secondary" />
                        </div>
                        <input
                            id="pointsValue"
                            name="pointsValue"
                            type="number"
                            min="1"
                            value={pointsValue}
                            onChange={(e) => setPointsValue(parseInt(e.target.value, 10) || 1)}
                            className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                        />
                    </div>
                </div>

                {/* Description Input */}
                <div className="space-y-1">
                    <label htmlFor="description" className="block text-sm font-medium text-text-secondary">
                        Description (Optional)
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., 'Make sure all dishes are put away correctly.'"
                        className="block w-full rounded-md border border-border-subtle p-3 text-text-primary bg-bg-surface"
                    />
                </div>

                {/* Assign Members (Mandatory) */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-secondary">
                        Assign to (Mandatory)
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border border-border-subtle">
                        {householdMembers.length > 0 ? householdMembers.map((member) => (
                            <button
                                type="button"
                                key={member._id}
                                title={`Assign to ${member.displayName}`}
                                onClick={() => toggleAssignment(member)}
                                className={`flex items-center space-x-2 p-2 pr-3 rounded-full border transition-all
                            ${isMemberAssigned(member)
                                        ? 'bg-action-primary/10 border-action-primary text-action-primary'
                                        : 'bg-bg-surface border-border-subtle text-text-secondary hover:bg-border-subtle'}`}
                            >
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: member.profileColor || '#808080' }}
                                >
                                    {member.displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{member.displayName}</span>
                                {isMemberAssigned(member) && (
                                    <UserCheck className="w-4 h-4" />
                                )}
                            </button>
                        )) : (
                            <p className="text-sm text-text-secondary p-2">No members available to assign.</p>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="flex items-center text-sm text-signal-alert">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-action-primary/60' : 'bg-action-primary hover:bg-action-hover'}`}
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                    Save Changes
                </button>
            </form>
        </Modal>
    );
};

export default EditTaskModal;