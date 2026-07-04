import { useContext } from 'react';
import { FamilyDataContext } from '../../app/components/layout/FamilyDataContext';

// Re-export the return type interface if needed, or import it
// The interface is defined in FamilyDataContext, but we can't export it from there easily if we want to avoid circular deps or complex imports if checking purely by filename.
// Actually, I can just not export the interface here if it's not explicitly used by name elsewhere.
// But earlier view_file showed: export interface FamilyData { ... }
// So I should probably keep the interface export to avoid breaking types in other files.

import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe, IMealPlan, IQuest, IRoutine, IRestaurant } from '../../app/types';

export interface FamilyData {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    quests: IQuest[];
    storeItems: IStoreItem[];
    mealPlans: IMealPlan[];
    recipes: IRecipe[];
    restaurants: IRestaurant[];
    routines: IRoutine[];
    loading: boolean;
    error: string | null;
    addTask: (task: ITask) => void;
    updateTask: (taskId: string, updates: Partial<ITask>) => void;
    refresh: (silent?: boolean) => Promise<void>;
}

export const useFamilyData = (): FamilyData => {
    const context = useContext(FamilyDataContext);
    if (!context) {
        throw new Error('useFamilyData must be used within a FamilyDataProvider');
    }
    return context;
};
