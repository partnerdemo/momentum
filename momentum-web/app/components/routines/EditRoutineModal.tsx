// =========================================================
// silkpanda/momentum/app/components/routines/EditRoutineModal.tsx
// Modal for editing an existing routine
// =========================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Award, Check, Loader, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IRoutine } from './RoutineList';
import { IHouseholdMemberProfile } from '../../types';

interface EditRoutineModalProps {
    routine: IRoutine;
    onClose: () => void;
    onRoutineUpdated: (routine: IRoutine) => void;
    members: IHouseholdMemberProfile[];
}

const EditRoutineModal: React.FC<EditRoutineModalProps> = ({ routine, onClose, onRoutineUpdated, members }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: routine.title,
        memberId: routine.memberId,
        timeOfDay: routine.timeOfDay,
        items: routine.items.map(s => s.title)
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...formData.items];
        newItems[index] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, items: newItems }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.memberId || formData.items.some(s => !s.trim())) {
            setError('Please fill in all required fields and ensure items are not empty.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Format payload for API
            const payload = {
                ...formData,
                items: formData.items.map((title, index) => ({
                    title,
                    order: index,
                    isCompleted: false
                }))
            };

            const response = await fetch(`/web-bff/routines/${routine._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update routine');
            }

            onRoutineUpdated(data.data.routine);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-lg p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-action-primary" />
                    Edit Routine
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Routine Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Morning Routine"
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description removed */}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Assign To */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Assign To</label>
                            <select
                                name="memberId"
                                value={formData.memberId}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                {members.map(m => (
                                    <option key={m._id} value={m._id}>{m.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Time of Day */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Time of Day</label>
                            <select
                                name="timeOfDay"
                                value={formData.timeOfDay}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                <option value="morning">Morning</option>
                                <option value="noon">Noon</option>
                                <option value="night">Night</option>
                            </select>
                        </div>
                    </div>

                    {/* Points removed */}

                    {/* Items */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Routine Items</label>
                        <div className="space-y-2">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => handleItemChange(index, e.target.value)}
                                            placeholder={`Item ${index + 1}`}
                                            className="w-full p-2 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                        />
                                    </div>
                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-text-tertiary hover:text-signal-alert transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-2 text-sm text-action-primary hover:text-action-primary/80 font-medium flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                            ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-primary/90 shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditRoutineModal;
