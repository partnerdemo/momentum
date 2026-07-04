// =========================================================
// silkpanda/momentum/app/components/meals/EditMealPlanModal.tsx
// Modal for editing an existing meal plan and managing meals
// =========================================================
'use client';

import React, { useState, useMemo } from 'react';
import { X, Calendar, Loader, AlertTriangle, Check, Plus, Trash2, Utensils } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IMealPlan, IRecipe, IRestaurant } from '../../types';

import Modal from '../shared/Modal';

interface EditMealPlanModalProps {
    mealPlan: IMealPlan;
    recipes: IRecipe[];
    restaurants: IRestaurant[];
    onClose: () => void;
    onMealPlanUpdated: (plan: IMealPlan) => void;
}

const EditMealPlanModal: React.FC<EditMealPlanModalProps> = ({ mealPlan, recipes, restaurants, onClose, onMealPlanUpdated }) => {
    const { token } = useSession();
    // ... existing hook logic ... 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localMeals, setLocalMeals] = useState(mealPlan.meals || []);

    const [formData, setFormData] = useState({
        startDate: mealPlan.startDate.split('T')[0],
        endDate: mealPlan.endDate.split('T')[0]
    });

    // State for the "Add Meal" form
    const [addingMealFor, setAddingMealFor] = useState<{ date: string, type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' } | null>(null);
    const [newItemType, setNewItemType] = useState<'Recipe' | 'Restaurant'>('Recipe');
    const [newItemId, setNewItemId] = useState<string>('');

    const days = useMemo(() => {
        if (!formData.startDate || !formData.endDate) return [];

        try {
            // Parse strings as local time components to avoid UTC shifts
            const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);

            const start = new Date(startYear, startMonth - 1, startDay);
            const end = new Date(endYear, endMonth - 1, endDay);

            const dayList = [];
            // Safety check to prevent infinite loop
            if (start > end) return [];

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dayList.push(new Date(d));
            }
            return dayList;
        } catch (e) {
            return [];
        }
    }, [formData.startDate, formData.endDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Keep track of original meals to calculate diffs on save
    const [originalMeals] = useState(mealPlan.meals || []);

    const handleSaveChanges = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Update Dates if changed
            if (formData.startDate !== mealPlan.startDate.split('T')[0] ||
                formData.endDate !== mealPlan.endDate.split('T')[0]) {

                const response = await fetch(`/web-bff/meals/plans/${mealPlan._id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                    }),
                });
                if (!response.ok) throw new Error('Failed to update dates');
            }

            // 2. Handle Added Meals
            const addedMeals = localMeals.filter(m => m._id.startsWith('temp_'));
            const tempIdToRealMeal: Record<string, any> = {};

            for (const meal of addedMeals) {
                const response = await fetch(`/web-bff/meals/plans/${mealPlan._id}/meals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        date: meal.date,
                        mealType: meal.mealType,
                        itemType: meal.itemType,
                        itemId: meal.itemId?._id
                    }),
                });
                if (!response.ok) throw new Error('Failed to save new meals');

                const data = await response.json();
                tempIdToRealMeal[meal._id] = data.data.meal;
            }

            // 3. Handle Removed Meals
            console.log('[EditMealPlanModal] Calculating removed meals...');
            console.log('[EditMealPlanModal] Original Meals:', originalMeals);
            console.log('[EditMealPlanModal] Local Meals:', localMeals);

            const removedMeals = originalMeals.filter(om => !localMeals.find(lm => lm._id === om._id));
            console.log('[EditMealPlanModal] Removed Meals to delete:', removedMeals);

            for (const meal of removedMeals) {
                // Skip deleting temp meals that were never saved
                if (meal._id.startsWith('temp_')) continue;

                console.log(`[EditMealPlanModal] Deleting meal: ${meal._id}`);
                const response = await fetch(`/web-bff/meals/plans/${mealPlan._id}/meals/${meal._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[EditMealPlanModal] Failed to delete meal ${meal._id}`, errorText);
                    throw new Error(`Failed to remove deleted meals: ${errorText}`);
                }
            }

            // Construct final meals list with real IDs
            const finalMeals = localMeals.map(m => tempIdToRealMeal[m._id] || m);

            // Success! Refresh parent and close
            onMealPlanUpdated({
                ...mealPlan,
                startDate: formData.startDate,
                endDate: formData.endDate,
                meals: finalMeals
            });
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMeal = () => {
        if (!addingMealFor || !newItemId) return;

        let selectedItem: any;
        if (newItemType === 'Recipe') {
            selectedItem = recipes.find(r => r._id === newItemId);
        } else {
            selectedItem = restaurants.find(r => r._id === newItemId);
        }

        const newMeal = {
            _id: `temp_${Date.now()}`,
            date: addingMealFor.date,
            mealType: addingMealFor.type,
            itemType: newItemType,
            itemId: selectedItem ? { _id: selectedItem._id, name: selectedItem.name } : undefined,
            customTitle: undefined
        };

        setLocalMeals([...localMeals, newMeal as any]);
        setAddingMealFor(null);
        setNewItemId('');
    };

    const handleRemoveMeal = (mealId: string) => {
        setLocalMeals(localMeals.filter(m => m._id !== mealId));
    };

    const getMealsForDayAndType = (date: Date, type: string) => {
        return localMeals.filter(m => {
            const mDate = new Date(m.date).toISOString().split('T')[0];
            const tDate = date.toISOString().split('T')[0];
            return mDate === tDate && m.mealType === type;
        });
    };

    const footer = (
        <div className="flex justify-end space-x-3">
            <button
                onClick={onClose}
                className="px-4 py-2 text-text-secondary hover:bg-bg-canvas rounded-lg transition-colors font-medium"
            >
                Cancel
            </button>
            <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="px-6 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover shadow-sm transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </button>
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Edit Meal Plan" maxWidth="max-w-4xl" zIndex="z-[60]" footer={footer}>
            <div className="space-y-6">
                {/* Date Range Form */}
                <div className="flex space-x-4 items-end bg-bg-canvas p-4 rounded-lg border border-border-subtle">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full p-2 rounded-lg border border-border-subtle bg-bg-surface text-text-primary text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full p-2 rounded-lg border border-border-subtle bg-bg-surface text-text-primary text-sm"
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Weekly Schedule */}
                <div className="space-y-8">
                    {days.map((day) => (
                        <div key={day.toISOString()} className="border border-border-subtle rounded-xl overflow-hidden">
                            <div className="bg-bg-canvas px-4 py-3 border-b border-border-subtle flex justify-between items-center">
                                <h3 className="font-semibold text-text-primary">
                                    {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                                    <div key={type} className="space-y-2">
                                        <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{type}</h4>

                                        {/* Existing Meals */}
                                        <div className="space-y-2">
                                            {getMealsForDayAndType(day, type).map(meal => (
                                                <div key={meal._id} className="flex items-start justify-between p-2 bg-bg-canvas rounded-lg border border-border-subtle group">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <p className="text-sm font-medium text-text-primary truncate">
                                                            {meal.itemId?.name || meal.customTitle || 'Unknown Item'}
                                                        </p>
                                                        <p className="text-xs text-text-secondary">
                                                            {meal.itemType}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveMeal(meal._id)}
                                                        className="text-text-tertiary hover:text-signal-alert opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Meal Button / Form */}
                                        {addingMealFor?.date === day.toISOString().split('T')[0] && addingMealFor?.type === type ? (
                                            <div className="p-3 bg-bg-canvas rounded-lg border border-action-primary/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                                <div className="space-y-2 mb-2">
                                                    <select
                                                        value={newItemType}
                                                        onChange={e => setNewItemType(e.target.value as any)}
                                                        className="w-full p-1.5 text-sm rounded border border-border-subtle bg-bg-surface text-text-primary"
                                                    >
                                                        <option value="Recipe">Recipe</option>
                                                        <option value="Restaurant">Restaurant</option>
                                                    </select>
                                                    <select
                                                        value={newItemId}
                                                        onChange={e => setNewItemId(e.target.value)}
                                                        className="w-full p-1.5 text-sm rounded border border-border-subtle bg-bg-surface text-text-primary"
                                                    >
                                                        <option value="">Select Item...</option>
                                                        {newItemType === 'Recipe' ? (
                                                            recipes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)
                                                        ) : (
                                                            restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={handleAddMeal}
                                                        disabled={!newItemId || isLoading}
                                                        className="flex-1 py-1 bg-action-primary text-white text-xs font-medium rounded hover:bg-action-hover disabled:opacity-50"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        onClick={() => setAddingMealFor(null)}
                                                        className="flex-1 py-1 bg-border-subtle text-text-secondary text-xs font-medium rounded hover:bg-border-strong"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setAddingMealFor({ date: day.toISOString().split('T')[0], type: type as any });
                                                    setNewItemId('');
                                                }}
                                                className="w-full py-1.5 border border-dashed border-border-subtle rounded-lg text-xs text-text-tertiary hover:text-action-primary hover:border-action-primary/30 hover:bg-action-primary/5 transition-all flex items-center justify-center"
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Add
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default EditMealPlanModal;
