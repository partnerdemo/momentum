// =========================================================
// silkpanda/momentum/app/components/meals/CreateMealPlanModal.tsx
// Modal for creating a new meal plan
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Calendar, Loader, AlertTriangle, Check } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IMealPlan } from '../../types';
import Modal from '../shared/Modal';

interface CreateMealPlanModalProps {
    onClose: () => void;
    onMealPlanCreated: (plan: IMealPlan) => void;
}

const CreateMealPlanModal: React.FC<CreateMealPlanModalProps> = ({ onClose, onMealPlanCreated }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        startDate: '',
        endDate: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate) {
            setError('Please select both start and end dates.');
            return;
        }

        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            setError('Start date must be before end date.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/web-bff/meals/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    meals: [] // Initialize with empty meals
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create meal plan');
            }

            onMealPlanCreated(data.data.mealPlan);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="New Meal Plan" maxWidth="max-w-md" zIndex="z-[60]">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                        ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-primary/90 shadow-md hover:shadow-lg'}`}
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Create Plan</>}
                </button>
            </form>
        </Modal>
    );
};

export default CreateMealPlanModal;
