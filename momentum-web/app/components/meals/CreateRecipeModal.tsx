// =========================================================
// silkpanda/momentum/app/components/meals/CreateRecipeModal.tsx
// Modal for creating a new recipe
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, ChefHat, Clock, Users, Plus, Trash2, Loader, AlertTriangle, Check } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IRecipe } from '../../types';

interface CreateRecipeModalProps {
    onClose: () => void;
    onRecipeCreated: (recipe: IRecipe) => void;
}

const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({ onClose, onRecipeCreated }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        ingredients: [''],
        instructions: ['']
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['prepTimeMinutes', 'cookTimeMinutes'].includes(name) ? parseInt(value) || 0 : value
        }));
    };

    const handleArrayChange = (field: 'ingredients' | 'instructions', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addItem = (field: 'ingredients' | 'instructions') => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeItem = (field: 'ingredients' | 'instructions', index: number) => {
        if (formData[field].length > 1) {
            const newArray = formData[field].filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, [field]: newArray }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || formData.ingredients.some(i => !i.trim())) {
            setError('Please provide a name and valid ingredients.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/web-bff/meals/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create recipe');
            }

            onRecipeCreated(data.data.recipe);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-2xl p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                    <ChefHat className="w-6 h-6 mr-2 text-action-primary" />
                    Add New Recipe
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Recipe Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Mom's Spaghetti"
                                className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Prep Time */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Prep Time (mins)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                                <input
                                    type="number"
                                    name="prepTimeMinutes"
                                    value={formData.prepTimeMinutes}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Cook Time */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Cook Time (mins)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                                <input
                                    type="number"
                                    name="cookTimeMinutes"
                                    value={formData.cookTimeMinutes}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                />
                            </div>
                        </div>

                    </div>


                    {/* Ingredients */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Ingredients</label>
                        <div className="space-y-2">
                            {formData.ingredients.map((ing, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={ing}
                                        onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                                        placeholder={`Ingredient ${index + 1}`}
                                        className="flex-1 p-2 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                                    />
                                    {formData.ingredients.length > 1 && (
                                        <button type="button" onClick={() => removeItem('ingredients', index)} className="p-2 text-text-tertiary hover:text-signal-alert">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addItem('ingredients')} className="mt-2 text-sm text-action-primary font-medium flex items-center">
                            <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                        </button>
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Instructions</label>
                        <div className="space-y-2">
                            {formData.instructions.map((inst, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <span className="mt-3 text-xs text-text-tertiary w-4">{index + 1}.</span>
                                    <textarea
                                        value={inst}
                                        onChange={(e) => handleArrayChange('instructions', index, e.target.value)}
                                        placeholder={`Step ${index + 1}`}
                                        rows={2}
                                        className="flex-1 p-2 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none resize-none"
                                    />
                                    {formData.instructions.length > 1 && (
                                        <button type="button" onClick={() => removeItem('instructions', index)} className="p-2 mt-1 text-text-tertiary hover:text-signal-alert">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addItem('instructions')} className="mt-2 text-sm text-action-primary font-medium flex items-center">
                            <Plus className="w-4 h-4 mr-1" /> Add Step
                        </button>
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
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Save Recipe</>}
                    </button>
                </form>
            </div >
        </div >
    );
};

export default CreateRecipeModal;
