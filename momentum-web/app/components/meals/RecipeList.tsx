// =========================================================
// silkpanda/momentum/app/components/meals/RecipeList.tsx
// List of recipes
// =========================================================
'use client';

import React, { useState } from 'react';
import { Plus, Search, ChefHat, Clock, Users, Pencil, Trash2 } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import CreateRecipeModal from './CreateRecipeModal';
import EditRecipeModal from './EditRecipeModal';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

import { IRecipe } from '../../types';

interface RecipeListProps {
    recipes: IRecipe[];
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes: initialRecipes }) => {
    const { user, token } = useSession();
    const [recipes, setRecipes] = useState<IRecipe[]>(initialRecipes);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<IRecipe | null>(null);

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

    const handleRecipeCreated = (newRecipe: IRecipe) => {
        setRecipes([newRecipe, ...recipes]);
    };

    const handleRecipeUpdated = (updatedRecipe: IRecipe) => {
        setRecipes(recipes.map(r => r._id === updatedRecipe._id ? updatedRecipe : r));
    };

    const handleDeleteRecipe = async () => {
        if (!confirmDeleteId) return;

        try {
            const response = await fetch(`/web-bff/meals/recipes/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete recipe');
            }

            setRecipes(recipes.filter(r => r._id !== confirmDeleteId));
            setConfirmDeleteId(null);
            showAlert('Success', 'Recipe deleted successfully', 'success');
        } catch (err: any) {
            console.error("Failed to delete recipe:", err);
            showAlert('Error', err.message || "Failed to delete recipe", 'error');
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
                onConfirm={handleDeleteRecipe}
                title="Delete Recipe"
                message="Are you sure you want to delete this recipe? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary">Recipes</h2>
                {user?.role === 'Parent' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-3 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Recipe
                    </button>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateRecipeModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onRecipeCreated={handleRecipeCreated}
                />
            )}

            {editingRecipe && (
                <EditRecipeModal
                    recipe={editingRecipe}
                    onClose={() => setEditingRecipe(null)}
                    onRecipeUpdated={handleRecipeUpdated}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <div key={recipe._id} className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-5 hover:shadow-md transition-shadow relative group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
                                    <ChefHat className="w-5 h-5" />
                                </div>
                                {user?.role === 'Parent' && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingRecipe(recipe)}
                                            className="p-1.5 text-text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                            title="Edit Recipe"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(recipe._id)}
                                            className="p-1.5 text-text-tertiary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors"
                                            title="Delete Recipe"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-medium text-text-primary mb-1">{recipe.name}</h3>
                            <p className="text-sm text-text-secondary line-clamp-2 mb-3">{recipe.description || "No description."}</p>

                            <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                                {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                                    <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m</span>
                                    </div>
                                )}

                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-surface rounded-xl border border-border-subtle border-dashed">
                        <div className="mx-auto w-12 h-12 bg-bg-canvas rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">No recipes yet</h3>
                        <p className="text-text-secondary">Start building your family cookbook.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipeList;
