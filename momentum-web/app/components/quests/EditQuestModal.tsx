// =========================================================
// silkpanda/momentum/app/components/quests/EditQuestModal.tsx
// Modal for editing an existing quest
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Zap, Award, Calendar, Repeat, Check, Loader, AlertTriangle } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IQuest } from '../../types';

interface EditQuestModalProps {
    quest: IQuest;
    onClose: () => void;
    onQuestUpdated: (quest: IQuest) => void;
}

const EditQuestModal: React.FC<EditQuestModalProps> = ({ quest, onClose, onQuestUpdated }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: quest.title,
        description: quest.description || '',
        pointsValue: quest.pointsValue,
        questType: quest.questType,
        recurrence: quest.recurrence?.frequency || 'daily',
        maxClaims: quest.maxClaims || 1,
        dueDate: quest.expiresAt ? new Date(quest.expiresAt).toISOString().split('T')[0] : '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pointsValue' || name === 'maxClaims' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || formData.pointsValue <= 0) {
            setError('Please provide a title and valid points value.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/web-bff/quests/${quest._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update quest');
            }

            onQuestUpdated(data.data.quest);
            onClose();
        } catch (err: any) {
            setError(err.message);
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
                    Edit Quest
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Quest Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Clean the Garage"
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
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
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                            <select
                                name="questType"
                                value={formData.questType}
                                onChange={handleChange}
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                <option value="one-time">One-time</option>
                                <option value="limited">Limited</option>
                                <option value="unlimited">Unlimited (Recurring)</option>
                            </select>
                        </div>
                    </div>

                    {/* Recurrence (if unlimited) */}
                    {formData.questType === 'unlimited' && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Frequency</label>
                            <div className="relative">
                                <Repeat className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                                <select
                                    name="recurrence"
                                    value={formData.recurrence}
                                    onChange={handleChange}
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
                                onChange={handleChange}
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            />
                        </div>
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
                            ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-hover shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditQuestModal;
