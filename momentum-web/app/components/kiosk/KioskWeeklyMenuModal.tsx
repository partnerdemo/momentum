'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, Sun, Pizza, Coffee, Calendar, Pencil, Check, Loader2, Type, ChefHat, Store, Trash2, LockOpen, Image as ImageIcon, Upload } from 'lucide-react';
import { IMealPlan, IHouseholdMemberProfile, IRecipe, IRestaurant } from '../../types';
import PinVerificationModal from '../auth/PinVerificationModal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

interface KioskWeeklyMenuModalProps {
    mealPlans?: IMealPlan[];
    members: IHouseholdMemberProfile[];
    onClose: () => void;
    onUnlockEditing: () => void;
}

type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

interface EditingCell {
    dateString: string;
    mealType: MealType;
}

const MEAL_CONFIG: { type: MealType; icon: React.FC<any>; color: string }[] = [
    { type: 'Breakfast', icon: Sun, color: 'text-orange-500' },
    { type: 'Lunch', icon: Pizza, color: 'text-green-600' },
    { type: 'Dinner', icon: Coffee, color: 'text-blue-600' },
];

export default function KioskWeeklyMenuModal({
    mealPlans = [],
    members = [],
    onClose,
    onUnlockEditing
}: KioskWeeklyMenuModalProps) {
    const { householdId, token } = useSession();
    const { recipes, restaurants, refresh } = useFamilyData();

    // Parent PIN Verification States
    const [showParentSelect, setShowParentSelect] = useState(false);
    const [selectedParent, setSelectedParent] = useState<IHouseholdMemberProfile | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    // Editing States
    const [isEditing, setIsEditing] = useState(false);
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [customInput, setCustomInput] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get current date strings for matching and highlighting
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;

    // Find the active meal plan containing today
    const activePlan = mealPlans.find(plan => {
        const sDate = plan.startDate ? plan.startDate.split('T')[0] : '';
        const eDate = plan.endDate ? plan.endDate.split('T')[0] : '';
        return todayString >= sDate && todayString <= eDate;
    });

    const hasPlan = !!activePlan;

    // Filter list of parents for PIN gate
    const parents = members.filter(m => m.role === 'Parent');

    // Close popover on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setEditingCell(null);
                setCustomInput('');
            }
        };
        if (editingCell) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [editingCell]);

    // Focus input when popover opens
    useEffect(() => {
        if (editingCell) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [editingCell]);

    // Clear save success indicator after a short delay
    useEffect(() => {
        if (saveSuccess) {
            const t = setTimeout(() => setSaveSuccess(null), 1800);
            return () => clearTimeout(t);
        }
    }, [saveSuccess]);

    // Handle initiating parent edit mode
    const handleEditClick = () => {
        if (parents.length === 0) {
            setIsEditing(true);
            return;
        }
        if (parents.length === 1) {
            setSelectedParent(parents[0]);
            setIsPinModalOpen(true);
        } else {
            setShowParentSelect(true);
        }
    };

    const handleParentSelected = (parent: IHouseholdMemberProfile) => {
        setSelectedParent(parent);
        setShowParentSelect(false);
        setIsPinModalOpen(true);
    };

    const handlePinSuccess = () => {
        setIsPinModalOpen(false);
        setSelectedParent(null);
        setIsEditing(true);
    };

    const handleLockEditing = () => {
        setIsEditing(false);
        setEditingCell(null);
        setCustomInput('');
    };

    // Handle tapping a meal cell to edit it
    const handleMealCellClick = (dateString: string, mealType: MealType) => {
        if (!isEditing) return;
        setEditingCell({ dateString, mealType });
        // Pre-fill input with current meal name
        const currentMeal = getMealForDateAndType(dateString, mealType);
        const mealEntry = getMealEntryForDateAndType(dateString, mealType);
        setCustomInput(currentMeal || '');
        setUploadedImage(mealEntry?.imageUrl || (mealEntry?.itemId as any)?.image || null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Get the current meal name for a date + type
    const getMealForDateAndType = (dateString: string, mealType: MealType): string => {
        if (!activePlan?.meals) return '';
        const meal = activePlan.meals.find(m => {
            const mealDate = m.date ? (typeof m.date === 'string' ? m.date.split('T')[0] : new Date(m.date).toISOString().split('T')[0]) : '';
            return mealDate === dateString && m.mealType === mealType;
        });
        return meal?.customTitle || meal?.itemId?.name || '';
    };

    // Get the existing meal entry object for a date + type
    const getMealEntryForDateAndType = (dateString: string, mealType: MealType) => {
        if (!activePlan?.meals) return null;
        return activePlan.meals.find(m => {
            const mealDate = m.date ? (typeof m.date === 'string' ? m.date.split('T')[0] : new Date(m.date).toISOString().split('T')[0]) : '';
            return mealDate === dateString && m.mealType === mealType;
        }) || null;
    };

    // Save a custom meal title
    const handleSaveCustomMeal = async (title: string) => {
        if (!editingCell || !title.trim()) return;
        await saveMeal(editingCell.dateString, editingCell.mealType, 'Custom', undefined, title.trim(), uploadedImage || undefined);
    };

    // Save a recipe or restaurant selection
    const handleSelectItem = async (itemType: 'Recipe' | 'Restaurant', itemId: string) => {
        if (!editingCell) return;
        await saveMeal(editingCell.dateString, editingCell.mealType, itemType, itemId, undefined, uploadedImage || undefined);
    };

    // Clear a meal slot
    const handleClearMeal = async () => {
        if (!editingCell) return;
        const existingMeal = getMealEntryForDateAndType(editingCell.dateString, editingCell.mealType);
        if (!existingMeal || existingMeal._id.startsWith('temp_')) {
            setEditingCell(null);
            setCustomInput('');
            return;
        }

        setIsSaving(true);
        try {
            if (activePlan) {
                const response = await fetch(`/web-bff/meals/plans/${activePlan._id}/meals/${existingMeal._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to remove meal');
            }
            await refresh();
            setSaveSuccess(`${editingCell.mealType} cleared`);
            setEditingCell(null);
            setCustomInput('');
        } catch (err) {
            console.error('Error clearing meal:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Core save function
    const saveMeal = async (dateString: string, mealType: MealType, itemType: string, itemId?: string, customTitle?: string, imageUrl?: string) => {
        setIsSaving(true);
        try {
            const existingMeal = getMealEntryForDateAndType(dateString, mealType);

            // If there's an existing meal, delete it first (replace approach)
            if (existingMeal && activePlan && !existingMeal._id.startsWith('temp_')) {
                await fetch(`/web-bff/meals/plans/${activePlan._id}/meals/${existingMeal._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
            }

            // If we have an active plan, add the new meal
            if (activePlan) {
                const body: Record<string, any> = {
                    date: dateString,
                    mealType,
                    itemType,
                };
                if (itemId) body.itemId = itemId;
                if (customTitle) body.customTitle = customTitle;
                if (imageUrl) body.imageUrl = imageUrl;

                const response = await fetch(`/web-bff/meals/plans/${activePlan._id}/meals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                });
                if (!response.ok) throw new Error('Failed to save meal');
            }

            await refresh();
            setSaveSuccess(`${mealType} updated!`);
            setEditingCell(null);
            setCustomInput('');
        } catch (err) {
            console.error('Error saving meal:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate dates for the 7 days of the current week
    let startDateLocal = new Date();
    if (activePlan && activePlan.startDate) {
        const [sYear, sMonth, sDay] = activePlan.startDate.split('T')[0].split('-').map(Number);
        startDateLocal = new Date(sYear, sMonth - 1, sDay);
    } else {
        const currentDay = today.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        startDateLocal.setDate(today.getDate() + distanceToMonday);
    }

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const dateObj = new Date(startDateLocal);
        dateObj.setDate(startDateLocal.getDate() + i);

        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const dateString = `${y}-${m}-${d}`;

        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isToday = dateString === todayString;

        return { dateString, dayName, displayDate, isToday };
    });

    // Render a single meal cell
    const renderMealCell = (day: typeof weekDays[0], config: typeof MEAL_CONFIG[0]) => {
        const mealEntry = getMealEntryForDateAndType(day.dateString, config.type);
        const displayName = mealEntry?.customTitle || mealEntry?.itemId?.name || (hasPlan ? '' : config.type === 'Breakfast' ? 'Blueberry Pancakes' : config.type === 'Lunch' ? 'Quinoa Power Bowls' : 'Homemade Lasagna');
        const imageUrl = mealEntry?.imageUrl || (mealEntry?.itemId as any)?.image;
        const isActive = editingCell?.dateString === day.dateString && editingCell?.mealType === config.type;
        const Icon = config.icon;

        return (
            <div key={config.type} className="relative group">
                <div
                    onClick={() => handleMealCellClick(day.dateString, config.type)}
                    className={`p-3 bg-bg-canvas/50 rounded-xl border flex flex-col gap-1 transition-all duration-200 overflow-hidden relative ${
                        isEditing
                            ? isActive
                                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-500/5 cursor-pointer shadow-lg'
                                : 'border-border-subtle/50 hover:border-orange-400/50 hover:bg-orange-500/5 cursor-pointer hover:shadow-md'
                            : 'border-border-subtle/50'
                    }`}
                    style={{ minHeight: '90px' }}
                >
                    {/* Background Image Logic */}
                    {imageUrl && (
                        <>
                            <div 
                                className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-500 group-hover:scale-110" 
                                style={{ backgroundImage: `url(${imageUrl})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-0" />
                        </>
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 ${imageUrl ? 'text-white' : config.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary drop-shadow-md">{config.type}</span>
                        </div>
                        {isEditing && (
                            <Pencil className="w-3 h-3 text-text-tertiary opacity-50 drop-shadow-md" />
                        )}
                    </div>
                    <p className={`relative z-10 text-sm font-extrabold mt-auto drop-shadow-md ${displayName ? (imageUrl ? 'text-white' : 'text-text-primary') : 'text-text-secondary italic'}`}>
                        {displayName || 'Not planned'}
                    </p>
                </div>

                {/* Inline Edit Popover */}
                {isActive && (
                    <div
                        ref={popoverRef}
                        className="absolute z-[70] top-full left-0 right-0 mt-2 bg-bg-surface border-2 border-orange-500/30 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 min-w-[260px]"
                        style={{ maxHeight: '320px', overflowY: 'auto' }}
                    >
                        {isSaving ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-action-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-bold text-sm">Saving...</span>
                            </div>
                        ) : (
                            <>
                                {/* Image Upload Section */}
                                <div className="mb-4 pb-4 border-b border-border-subtle/50">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-2">
                                        <ImageIcon className="w-3 h-3" />
                                        Cover Image
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {uploadedImage && (
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border-subtle shrink-0 shadow-sm">
                                                <img src={uploadedImage} alt="Cover preview" className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => setUploadedImage(null)}
                                                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-border-subtle hover:border-orange-500 hover:bg-orange-500/5 rounded-xl cursor-pointer transition-all text-sm font-bold text-text-secondary hover:text-orange-600">
                                                <Upload className="w-4 h-4" />
                                                {uploadedImage ? 'Change Image' : 'Upload Image'}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Meal Input */}
                                <div className="mb-3">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1.5">
                                        <Type className="w-3 h-3" />
                                        Type a custom meal
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={customInput}
                                            onChange={e => setCustomInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) handleSaveCustomMeal(customInput); }}
                                            placeholder="e.g. Tacos, Spaghetti..."
                                            className="flex-1 px-3 py-2 text-sm bg-bg-canvas border border-border-subtle rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                                        />
                                        <button
                                            onClick={() => handleSaveCustomMeal(customInput)}
                                            disabled={!customInput.trim()}
                                            className="px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Recipes Section */}
                                {recipes && recipes.length > 0 && (
                                    <div className="mb-3">
                                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1.5">
                                            <ChefHat className="w-3 h-3" />
                                            Pick a recipe
                                        </label>
                                        <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                                            {recipes.map(recipe => (
                                                <button
                                                    key={recipe._id}
                                                    onClick={() => handleSelectItem('Recipe', recipe._id)}
                                                    className="text-left px-3 py-2 text-sm font-semibold text-text-primary bg-bg-canvas hover:bg-orange-500/10 hover:text-orange-600 rounded-lg border border-border-subtle/50 transition-all cursor-pointer truncate"
                                                >
                                                    {recipe.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Restaurants Section */}
                                {restaurants && restaurants.length > 0 && (
                                    <div className="mb-3">
                                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1.5">
                                            <Store className="w-3 h-3" />
                                            Pick a restaurant
                                        </label>
                                        <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                                            {restaurants.map(restaurant => (
                                                <button
                                                    key={restaurant._id}
                                                    onClick={() => handleSelectItem('Restaurant', restaurant._id)}
                                                    className="text-left px-3 py-2 text-sm font-semibold text-text-primary bg-bg-canvas hover:bg-blue-500/10 hover:text-blue-600 rounded-lg border border-border-subtle/50 transition-all cursor-pointer truncate"
                                                >
                                                    {restaurant.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Clear Meal Button */}
                                {mealName && (
                                    <button
                                        onClick={handleClearMeal}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-signal-alert bg-signal-alert/10 hover:bg-signal-alert/20 rounded-xl border border-signal-alert/20 transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Clear this meal
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            {/* Modal Body */}
            <div className="relative w-full max-w-7xl h-[85vh] bg-bg-surface text-text-primary rounded-3xl border-2 border-orange-200/20 shadow-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.12)]">

                {/* Header */}
                <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-bg-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/40 text-orange-500 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-text-primary">Weekly Menu</h2>
                            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-0.5">
                                {isEditing
                                    ? '✏️ Editing Mode — Tap a meal to change it'
                                    : hasPlan
                                        ? 'Data-driven Family Meal Planner'
                                        : 'Sample Weekly Schedule • Create Your Own!'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Save Success Toast */}
                        {saveSuccess && (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 text-green-600 border border-green-500/30 rounded-xl text-sm font-bold animate-in fade-in zoom-in-95 duration-200">
                                <Check className="w-4 h-4" />
                                {saveSuccess}
                            </div>
                        )}

                        {/* Edit / Lock Button */}
                        {isEditing ? (
                            <button
                                onClick={handleLockEditing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-xl font-bold transition-all text-sm hover:scale-[1.02] cursor-pointer shadow-lg shadow-orange-500/20"
                            >
                                <LockOpen className="w-4 h-4" />
                                <span>Done Editing</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleEditClick}
                                className="flex items-center gap-2 px-5 py-2.5 bg-bg-canvas hover:bg-bg-subtle text-text-secondary hover:text-action-primary border border-border-subtle rounded-xl font-bold transition-all text-sm hover:scale-[1.02] cursor-pointer"
                            >
                                <Lock className="w-4 h-4 text-orange-500" />
                                <span>Edit Weekly Plan</span>
                            </button>
                        )}

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="w-11 h-11 rounded-full bg-bg-canvas hover:bg-bg-subtle border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 p-6 overflow-y-auto bg-bg-canvas/10">
                    {/* Editing Mode Banner */}
                    {isEditing && (
                        <div className="mb-5 flex items-center gap-3 px-5 py-3 bg-orange-500/10 border border-orange-500/25 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                            <Pencil className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-text-primary">
                                Tap any meal to edit it. Type a custom name or choose from your recipes and restaurants.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5 h-full">
                        {weekDays.map((day) => (
                            <div
                                key={day.dateString}
                                className={`rounded-2xl p-5 flex flex-col transition-all duration-300 relative border-2 ${
                                    day.isToday
                                        ? 'bg-bg-surface border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-2 ring-orange-500/20'
                                        : 'bg-bg-surface/85 border-border-subtle hover:border-orange-500/30'
                                }`}
                            >
                                {/* Today Badge */}
                                {day.isToday && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white font-black text-[9px] uppercase tracking-widest rounded-full shadow-md">
                                        Today
                                    </span>
                                )}

                                {/* Date Label */}
                                <div className="text-center pb-4 border-b border-border-subtle mb-4">
                                    <h4 className="font-black text-xl text-text-primary">{day.dayName.substring(0, 3)}</h4>
                                    <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{day.displayDate}</p>
                                </div>

                                {/* Meals List */}
                                <div className="flex-1 flex flex-col gap-4">
                                    {MEAL_CONFIG.map(config => renderMealCell(day, config))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-bg-canvas/20 border-t border-border-subtle flex justify-between items-center text-xs text-text-secondary font-bold uppercase tracking-wider">
                    <span>Active Meal Plans: {mealPlans.length} Total</span>
                    <span className="text-orange-500">ADHD Routine Helper • Fuel Mind & Body</span>
                </div>
            </div>

            {/* Parent Selector Overlay */}
            {showParentSelect && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-bg-surface border-2 border-border-subtle rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 text-center animate-in zoom-in-95 duration-200">
                        <div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary">Parent Verification</h3>
                            <p className="text-sm text-text-secondary mt-1">Select your profile to unlock meal editing</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {parents.map(parent => (
                                <button
                                    key={parent._id}
                                    onClick={() => handleParentSelected(parent)}
                                    className="flex items-center justify-between p-4 bg-bg-canvas hover:bg-bg-subtle border border-border-subtle hover:border-orange-500/50 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4.5 h-4.5 rounded-full"
                                            style={{ backgroundColor: parent.profileColor }}
                                        />
                                        <span className="font-extrabold text-text-primary text-lg">{parent.displayName}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Tap to Verify</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowParentSelect(false)}
                            className="mt-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* PIN Verification Modal */}
            {selectedParent && (
                <PinVerificationModal
                    isOpen={isPinModalOpen}
                    onClose={() => {
                        setIsPinModalOpen(false);
                        setSelectedParent(null);
                    }}
                    onSuccess={handlePinSuccess}
                    title={`Verify ${selectedParent.displayName}`}
                    description={`Enter the 4-digit PIN for ${selectedParent.displayName} to unlock edits.`}
                    memberId={selectedParent._id}
                    householdId={householdId || ''}
                />
            )}
        </div>
    );
}
