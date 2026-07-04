// =========================================================
// silkpanda/momentum/app/components/quests/CreateQuestModal.tsx
// Modal for creating a new quest
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Zap, Award, Calendar, Repeat, Check, Loader, AlertTriangle } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IQuest } from '../../types';
import {
    validateForm,
    getInitialFormData,
    sanitizeFormData,
    type FormField,
    type FormData
} from 'momentum-shared';

interface CreateQuestModalProps {
    onClose: () => void;
    onQuestCreated: (quest: IQuest) => void;
}

const QUEST_FORM_FIELDS: FormField[] = [
    { name: 'title', label: 'Quest Title', type: 'text', required: true, min: 3 },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'pointsValue', label: 'Points Reward', type: 'number', required: true, min: 1, defaultValue: 10 },
    { name: 'dueDate', label: 'Due Date', type: 'text', required: false }, // Using text for date input for now
];

const CreateQuestModal: React.FC<CreateQuestModalProps> = ({ onClose, onQuestCreated }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form State
    const [formData, setFormData] = useState<FormData>(getInitialFormData(QUEST_FORM_FIELDS));
    const [questType, setQuestType] = useState<'one-time' | 'limited' | 'unlimited'>('one-time');
    const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
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
        const validation = validateForm(formData, QUEST_FORM_FIELDS);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            // 2. Sanitize Data
            const sanitizedData = sanitizeFormData(formData, QUEST_FORM_FIELDS);

            const payload = {
                ...sanitizedData,
                questType,
                recurrence: questType === 'unlimited' ? { frequency: recurrence } : undefined,
            };

            const response = await fetch('/web-bff/quests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create quest');
            }

            onQuestCreated(data.data.quest);
            onClose();
        } catch (err: any) {
            setErrors(prev => ({ ...prev, global: err.message }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-lg p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-action-primary" />
                    Create New Quest
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Quest Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g., Clean the Garage"
                            className={`w-full p-3 rounded-lg border bg-bg-canvas text-text-primary outline-none transition-all
                                ${errors.title ? 'border-signal-alert focus:ring-signal-alert' : 'border-border-subtle focus:ring-action-primary'}`}
                            autoFocus
                        />
                        {errors.title && <p className="text-xs text-signal-alert mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            placeholder="Details about what needs to be done..."
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Points */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Points Reward</label>
                            <div className="relative">
                                <Award className="absolute left-3 top-3 w-5 h-5 text-brand-secondary" />
                                <input
                                    type="number"
                                    name="pointsValue"
                                    value={formData.pointsValue}
                                    onChange={(e) => handleChange('pointsValue', e.target.value)}
                                    min="1"
                                    className={`w-full pl-10 p-3 rounded-lg border bg-bg-canvas text-text-primary outline-none
                                        ${errors.pointsValue ? 'border-signal-alert focus:ring-signal-alert' : 'border-border-subtle focus:ring-action-primary'}`}
                                />
                            </div>
                            {errors.pointsValue && <p className="text-xs text-signal-alert mt-1">{errors.pointsValue}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                            <select
                                name="questType"
                                value={questType}
                                onChange={(e) => setQuestType(e.target.value as any)}
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                <option value="one-time">One-time</option>
                                <option value="limited">Limited</option>
                                <option value="unlimited">Unlimited (Recurring)</option>
                            </select>
                        </div>
                    </div>

                    {/* Recurrence (if unlimited/recurring) */}
                    {questType === 'unlimited' && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Frequency</label>
                            <div className="relative">
                                <Repeat className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                                <select
                                    name="recurrence"
                                    value={recurrence}
                                    onChange={(e) => setRecurrence(e.target.value as any)}
                                    className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Due Date (Optional)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            />
                        </div>
                    </div>

                    {/* Global Error Message */}
                    {errors.global && (
                        <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {errors.global}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                            ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-hover shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Create Quest</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateQuestModal;
