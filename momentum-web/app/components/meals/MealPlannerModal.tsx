'use client';

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Loader, AlertTriangle, Plus, Trash, ChefHat, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '../shared/Modal';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

import { IMealPlan } from '../../types';
import CreateMealPlanModal from './CreateMealPlanModal';
import EditMealPlanModal from './EditMealPlanModal';
import CreateRecipeModal from './CreateRecipeModal';
import CreateRestaurantModal from './CreateRestaurantModal';

interface MealPlannerModalProps {
    onClose: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { mealPlans, recipes, restaurants, loading, refresh } = useFamilyData();

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<IMealPlan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<IMealPlan | null>(null);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
    const [expandedPlanIds, setExpandedPlanIds] = useState<string[]>([]);

    // Initialize first plan as expanded when data loads
    useEffect(() => {
        if (mealPlans && mealPlans.length > 0 && expandedPlanIds.length === 0) {
            setExpandedPlanIds([mealPlans[0]._id]);
        }
    }, [mealPlans]);

    const handleClose = () => {
        setIsCreateModalOpen(false);
        setEditingPlan(null);
        setPlanToDelete(null);
    };

    const handleSuccess = async () => {
        handleClose();
        await refresh();
    };

    const togglePlanExpansion = (planId: string) => {
        setExpandedPlanIds(prev =>
            prev.includes(planId)
                ? prev.filter(id => id !== planId)
                : [...prev, planId]
        );
    };

    const handleDeletePlan = async () => {
        if (!planToDelete) return;

        try {
            const response = await fetch(`/web-bff/meals/plans/${planToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete meal plan');
            }

            await refresh();
            setPlanToDelete(null);
        } catch (error) {
            console.error('Error deleting meal plan:', error);
        }
    };

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title="Meal Planner" maxWidth="max-w-2xl">
                <div className="space-y-4 min-h-[400px]">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-text-secondary">Plan your family's meals for the week</p>
                        <button
                            className="flex items-center space-x-2 px-3 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover text-sm"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Plan</span>
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader className="w-8 h-8 text-action-primary animate-spin mb-2" />
                            <p className="text-text-secondary">Loading meal plans...</p>
                        </div>
                    ) : (!mealPlans || mealPlans.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <UtensilsCrossed className="w-12 h-12 text-border-subtle mb-3" />
                            <p className="text-text-primary font-medium">No meal plan yet</p>
                            <p className="text-sm text-text-secondary mt-1">Create your first weekly meal plan to get started.</p>
                            <button
                                className="mt-4 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                Create Meal Plan
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                            {mealPlans.filter(plan => plan.startDate).map((plan) => {
                                const isExpanded = expandedPlanIds.includes(plan._id);

                                // Parse start date in local time to fix off-by-one error
                                const dateParts = (plan.startDate || '').split('T')[0].split('-').map(Number);
                                const [sYear, sMonth, sDay] = dateParts.length === 3 ? dateParts : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
                                const startDateLocal = new Date(sYear, sMonth - 1, sDay);

                                return (
                                    <div key={plan._id}>
                                        {/* Week Header */}
                                        <div className={`p-3 flex justify-between items-center transition-all duration-200 ${isExpanded
                                            ? 'bg-bg-surface border border-border-subtle rounded-t-lg border-b-0'
                                            : 'bg-bg-surface border border-border-subtle rounded-lg'
                                            }`}>
                                            <div
                                                className="flex items-center cursor-pointer select-none"
                                                onClick={() => togglePlanExpansion(plan._id)}
                                            >
                                                <button className="mr-3 p-1 rounded-md text-text-tertiary hover:bg-bg-subtle transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <div>
                                                    <h3 className="font-semibold text-text-primary">
                                                        Week of {startDateLocal.toLocaleDateString()}
                                                    </h3>
                                                    <p className="text-sm text-text-secondary">
                                                        {plan.meals?.length || 0} meals planned
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setEditingPlan(plan)}
                                                    className="text-xs px-3 py-1.5 bg-bg-canvas border border-border-subtle rounded-lg hover:bg-bg-subtle transition-colors"
                                                >
                                                    Edit Plan
                                                </button>
                                                <button
                                                    onClick={() => setPlanToDelete(plan)}
                                                    className="text-xs px-2 py-1.5 bg-bg-canvas border border-border-subtle text-text-tertiary hover:text-signal-alert rounded-lg hover:bg-signal-alert/10 transition-colors"
                                                    title="Delete Plan"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Days Grid */}
                                        {isExpanded && (
                                            <div className="border border-border-subtle border-t-0 rounded-b-lg p-4 bg-bg-canvas/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {(() => {
                                                    // Parse dates accurately (ignoring time)
                                                    const s = new Date(plan.startDate);
                                                    const e = new Date(plan.endDate);
                                                    const diffTime = Math.abs(e.getTime() - s.getTime());
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                    const dayCount = Math.max(1, Math.min(diffDays, 7)); // Clamp between 1 and 7 just in case

                                                    return Array.from({ length: dayCount });
                                                })().map((_, i) => {
                                                    // Generate date for this day of the week
                                                    const currentDate = new Date(startDateLocal);
                                                    currentDate.setDate(startDateLocal.getDate() + i);
                                                    const dateString = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

                                                    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
                                                    const displayDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                                                    // Filter meals matching this specific date
                                                    const dayMeals = plan.meals?.filter((meal: any) => {
                                                        const mealDate = meal.date ? meal.date.split('T')[0] : '';
                                                        return mealDate === dateString;
                                                    }) || [];

                                                    return (
                                                        <div key={dateString} className="bg-bg-surface border border-border-subtle rounded-lg p-4">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h4 className="font-semibold text-text-primary">
                                                                    {dayName} <span className="text-text-tertiary font-normal ml-1">{displayDate}</span>
                                                                </h4>
                                                                <button
                                                                    className="text-xs text-action-primary hover:underline"
                                                                    onClick={() => setEditingPlan(plan)}
                                                                >
                                                                    + Add Meal
                                                                </button>
                                                            </div>

                                                            {dayMeals.length === 0 ? (
                                                                <p className="text-sm text-text-tertiary italic">No meals planned</p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {dayMeals.map((meal: any, mealIndex: number) => (
                                                                        <div
                                                                            key={mealIndex}
                                                                            className="flex items-center justify-between p-2 bg-bg-canvas rounded border border-border-subtle"
                                                                        >
                                                                            <div className="flex items-center space-x-3">
                                                                                <span className="text-xs font-medium text-text-secondary uppercase w-16">
                                                                                    {meal.mealType}
                                                                                </span>
                                                                                <span className="text-sm text-text-primary">
                                                                                    {meal.customTitle || meal.itemId?.name || 'Untitled'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Quick Actions Footer */}
                    <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
                        <p className="text-xs text-text-tertiary">Quick Actions</p>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsRecipeModalOpen(true)}
                                className="flex items-center px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-canvas border border-border-subtle rounded-lg hover:bg-bg-subtle hover:text-text-primary transition-colors"
                            >
                                <ChefHat className="w-3.5 h-3.5 mr-1.5" />
                                Add Recipe
                            </button>
                            <button
                                onClick={() => setIsRestaurantModalOpen(true)}
                                className="flex items-center px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-canvas border border-border-subtle rounded-lg hover:bg-bg-subtle hover:text-text-primary transition-colors"
                            >
                                <Utensils className="w-3.5 h-3.5 mr-1.5" />
                                Add Restaurant
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {isCreateModalOpen && (
                <CreateMealPlanModal
                    onClose={handleClose}
                    onMealPlanCreated={handleSuccess}
                />
            )}

            {editingPlan && (
                <EditMealPlanModal
                    mealPlan={editingPlan}
                    recipes={recipes}
                    restaurants={restaurants}
                    onClose={handleClose}
                    onMealPlanUpdated={handleSuccess}
                />
            )}

            <ConfirmModal
                isOpen={!!planToDelete}
                onClose={() => setPlanToDelete(null)}
                onConfirm={handleDeletePlan}
                title="Delete Meal Plan"
                message="Are you sure you want to delete this meal plan? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            {isRecipeModalOpen && (
                <CreateRecipeModal
                    onClose={() => setIsRecipeModalOpen(false)}
                    onRecipeCreated={handleSuccess}
                />
            )}

            {isRestaurantModalOpen && (
                <CreateRestaurantModal
                    onClose={() => setIsRestaurantModalOpen(false)}
                    onRestaurantCreated={handleSuccess}
                />
            )}
        </>
    );
};

export default MealPlannerModal;
