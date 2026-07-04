// =========================================================
// silkpanda/momentum/app/components/meals/MealPlanList.tsx
// List of meal plans
// =========================================================
'use client';

import React, { useState } from 'react';
import { Plus, Calendar, Search, Pencil, Trash } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import CreateMealPlanModal from './CreateMealPlanModal';
import EditMealPlanModal from './EditMealPlanModal';
import { IMealPlan, IRecipe, IRestaurant } from '../../types';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface MealPlanListProps {
    mealPlans: IMealPlan[];
    recipes: IRecipe[];
    restaurants: IRestaurant[];
}

const MealPlanList: React.FC<MealPlanListProps> = ({ mealPlans: initialMealPlans, recipes, restaurants }) => {
    const { user, token } = useSession();
    const [mealPlans, setMealPlans] = useState<IMealPlan[]>(initialMealPlans);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<IMealPlan | null>(null);

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

    const handleMealPlanCreated = (newPlan: IMealPlan) => {
        setMealPlans([newPlan, ...mealPlans]);
    };

    const handleMealPlanUpdated = (updatedPlan: IMealPlan) => {
        setMealPlans(mealPlans.map(p => p._id === updatedPlan._id ? updatedPlan : p));
    };

    const handleDeleteMealPlan = async () => {
        if (!confirmDeleteId) return;

        try {
            const response = await fetch(`/web-bff/meals/plans/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to delete meal plan');
            }

            setMealPlans(mealPlans.filter(p => p._id !== confirmDeleteId));
            setConfirmDeleteId(null);
            showAlert('Success', 'Meal plan deleted successfully', 'success');
        } catch (err) {
            console.error('Error deleting meal plan:', err);
            showAlert('Error', 'Failed to delete meal plan', 'error');
        }
    };

    return (
        <div className="space-y-6">
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
                onConfirm={handleDeleteMealPlan}
                title="Delete Meal Plan"
                message="Are you sure you want to delete this meal plan?"
                confirmText="Delete"
                variant="danger"
            />

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary">Meal Plans</h2>
                {user?.role === 'Parent' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-3 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        New Plan
                    </button>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateMealPlanModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onMealPlanCreated={handleMealPlanCreated}
                />
            )}

            {editingPlan && (
                <EditMealPlanModal
                    mealPlan={editingPlan}
                    recipes={recipes}
                    restaurants={restaurants}
                    onClose={() => setEditingPlan(null)}
                    onMealPlanUpdated={handleMealPlanUpdated}
                />
            )}

            <div className="grid grid-cols-1 gap-4">
                {mealPlans.length > 0 ? (
                    mealPlans.map((plan) => (
                        <div key={plan._id} className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-5 hover:shadow-md transition-shadow flex items-center justify-between group">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-lg bg-action-primary/10 text-action-primary">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-text-primary">
                                        {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                                    </h3>
                                    <p className="text-sm text-text-secondary">{plan.meals.length} meals planned</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button className="text-sm text-action-primary font-medium hover:underline">
                                    View Details
                                </button>
                                {user?.role === 'Parent' && (
                                    <>
                                        <button
                                            onClick={() => setEditingPlan(plan)}
                                            className="p-2 text-text-tertiary hover:text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Edit Plan"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(plan._id)}
                                            className="p-2 text-text-tertiary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Plan"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-bg-surface rounded-xl border border-border-subtle border-dashed">
                        <div className="mx-auto w-12 h-12 bg-bg-canvas rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">No meal plans</h3>
                        <p className="text-text-secondary">Plan your week ahead.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealPlanList;
