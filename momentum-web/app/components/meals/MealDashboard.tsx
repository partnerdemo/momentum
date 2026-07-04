// =========================================================
// silkpanda/momentum/app/components/meals/MealDashboard.tsx
// Main dashboard for Meals feature with tabs
// REFACTORED to fetch its own data
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import RecipeList from './RecipeList';
import RestaurantList from './RestaurantList';
import MealPlanList from './MealPlanList';
import { IRecipe, IRestaurant, IMealPlan } from '../../types';
import { useSession } from '../layout/SessionContext';
import Loading from '../layout/Loading';
import { AlertTriangle } from 'lucide-react';

const MealDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'plans' | 'recipes' | 'restaurants'>('plans');
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
    const [mealPlans, setMealPlans] = useState<IMealPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { token, householdId } = useSession();

    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/web-bff/meals/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch meal data.');
            }

            const data = await response.json();
            if (data) {
                setRecipes(data.recipes || []);
                setRestaurants(data.restaurants || []);
                setMealPlans(data.mealPlans || []);
            }
            setError(null);
        } catch (e: any) {
            setError(`Failed to load meal data: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Meals & Dining</h1>
                <p className="text-text-secondary">Manage recipes, favorite restaurants, and weekly meal plans.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-subtle">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'plans'
                            ? 'border-action-primary text-action-primary'
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
                            }`}
                    >
                        Meal Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('recipes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'recipes'
                            ? 'border-action-primary text-action-primary'
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
                            }`}
                    >
                        Recipes
                    </button>
                    <button
                        onClick={() => setActiveTab('restaurants')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'restaurants'
                            ? 'border-action-primary text-action-primary'
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-subtle'
                            }`}
                    >
                        Restaurants
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="pt-2">
                {activeTab === 'plans' && <MealPlanList mealPlans={mealPlans} recipes={recipes} restaurants={restaurants} />}
                {activeTab === 'recipes' && <RecipeList recipes={recipes} />}
                {activeTab === 'restaurants' && <RestaurantList restaurants={restaurants} />}
            </div>
        </div>
    );
};

export default MealDashboard;
