// =========================================================
// silkpanda/momentum/app/components/tasks/CreateTaskModal.tsx
// REFACTORED for Unified Task Assignment Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Refactored to use useSession()
// hook instead of direct localStorage access.
// =========================================================
'use client';

import React, { useState } from 'react';
import { Award, Check, Loader, Type, AlertTriangle, UserCheck } from 'lucide-react'; // Removed X
import { ITask, IHouseholdMemberProfile } from '../../types';
import { useSession } from '../layout/SessionContext';
import {
    validateForm,
    getInitialFormData,
    sanitizeFormData,
    type FormField,
    type FormData
} from 'momentum-shared';
import Modal from '../shared/Modal';

interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: (newTasks: ITask[]) => void;
    householdMembers: IHouseholdMemberProfile[];
}

const TASK_FORM_FIELDS: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true, min: 3 },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'pointsValue', label: 'Points Value', type: 'number', required: true, min: 1, defaultValue: 10 },
];

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated, householdMembers }) => {
    const [formData, setFormData] = useState<FormData>(getInitialFormData(TASK_FORM_FIELDS));
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { token } = useSession();

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Form Fields
        const validation = validateForm(formData, TASK_FORM_FIELDS);

        // 2. Custom Validation (Assignees)
        if (assignedTo.length === 0) {
            setErrors(prev => ({ ...prev, assignedTo: 'Please assign the task to at least one member.' }));
            return;
        }

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            // 3. Sanitize Data
            const sanitizedData = sanitizeFormData(formData, TASK_FORM_FIELDS);

            // 4. Create separate tasks for each assigned member (Frontend Splitting)
            // This ensures each member has their own independent task instance.
            const createPromises = assignedTo.map(memberId =>
                fetch('/web-bff/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: sanitizedData.title,
                        description: sanitizedData.description,
                        pointsValue: sanitizedData.pointsValue,
                        assignedTo: [memberId], // Create task for SINGLE member
                    }),
                }).then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to create task for a member.');

                    const createdTask = data.data.task;

                    // Manually populate assignedTo if it's just IDs (to fix "Unassigned" in UI)
                    if (createdTask.assignedTo && createdTask.assignedTo.length > 0 && typeof createdTask.assignedTo[0] === 'string') {
                        const memberId = createdTask.assignedTo[0];
                        const member = householdMembers.find(m => m._id === memberId);
                        if (member) {
                            createdTask.assignedTo = [{
                                _id: member._id,
                                displayName: member.displayName,
                                profileColor: member.profileColor,
                                familyMemberId: member.familyMemberId // preserving potential structure match
                            }];
                        }
                    }
                    return createdTask;
                })
            );

            const createdTasks = await Promise.all(createPromises);

            // Pass all created tasks to parent
            if (createdTasks.length > 0) {
                onTaskCreated(createdTasks);
            }

            onClose();

        } catch (err: any) {
            console.error(err);
            setErrors(prev => ({ ...prev, global: err.message || 'One or more tasks failed to create.' }));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAssignment = (memberProfile: IHouseholdMemberProfile) => {
        const memberRefId = memberProfile._id;
        setAssignedTo(prev => {
            if (prev.includes(memberRefId)) {
                return prev.filter(id => id !== memberRefId);
            } else {
                return [...prev, memberRefId];
            }
        });
        // Clear error
        if (errors.assignedTo) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.assignedTo;
                return newErrors;
            });
        }
    };

    const isMemberAssigned = (memberProfile: IHouseholdMemberProfile) => {
        return assignedTo.includes(memberProfile._id);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Create a New Task">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <p className="text-sm text-text-secondary pb-2">
                    Fill in the details for the new task.
                </p>

                {/* Task Title Input */}
                <div className="space-y-1">
                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary">
                        Task Title (Mandatory)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Type className="h-5 w-5 text-text-secondary" />
                        </div>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g., 'Empty the dishwasher'"
                            className={`block w-full rounded-md border p-3 pl-10 text-text-primary bg-bg-surface
                                    ${errors.title ? 'border-signal-alert focus:ring-signal-alert' : 'border-border-subtle focus:ring-action-primary'}`}
                        />
                    </div>
                    {errors.title && <p className="text-xs text-signal-alert mt-1">{errors.title}</p>}
                </div>

                {/* Points Value Input */}
                <div className="space-y-1">
                    <label htmlFor="pointsValue" className="block text-sm font-medium text-text-secondary">
                        Points Value (Mandatory)
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
                            value={formData.pointsValue}
                            onChange={(e) => handleChange('pointsValue', e.target.value)}
                            className={`block w-full rounded-md border p-3 pl-10 text-text-primary bg-bg-surface
                                    ${errors.pointsValue ? 'border-signal-alert focus:ring-signal-alert' : 'border-border-subtle focus:ring-action-primary'}`}
                        />
                    </div>
                    {errors.pointsValue && <p className="text-xs text-signal-alert mt-1">{errors.pointsValue}</p>}
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
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="e.g., 'Make sure all dishes are put away correctly.'"
                        className="block w-full rounded-md border border-border-subtle p-3 text-text-primary bg-bg-surface focus:ring-action-primary"
                    />
                </div>

                {/* Assign Members (Mandatory) */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-secondary">
                        Assign to (Mandatory)
                    </label>
                    <div className={`flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border 
                            ${errors.assignedTo ? 'border-signal-alert' : 'border-border-subtle'}`}>
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
                    {errors.assignedTo && <p className="text-xs text-signal-alert mt-1">{errors.assignedTo}</p>}
                </div>

                {/* Global Error Display */}
                {errors.global && (
                    <div className="flex items-center text-sm text-signal-alert">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> {errors.global}
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
                    Create Task
                </button>

            </form>
        </Modal>
    );
};

export default CreateTaskModal;