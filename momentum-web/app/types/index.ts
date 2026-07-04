// =========================================================
// momentum-web/app/types/index.ts
// Centralized Type Definitions
// =========================================================

// --- Task Interface ---
export interface ITask {
    _id: string;
    householdId: string;
    visibleToHouseholds?: string[];
    title: string;
    description?: string;
    pointsValue: number;
    status: 'Pending' | 'PendingApproval' | 'Approved';
    isCompleted?: boolean;
    assignedTo: {
        _id: string;
        displayName: string;
        profileColor?: string;
    }[];
    completedBy?: string;
    dueDate?: string; // Date string
    isRecurring: boolean;
    recurrenceInterval?: 'daily' | 'weekly' | 'monthly';
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

// --- Calendar Event Interface ---
export interface ICalendarEvent {
    id: string;
    title: string;
    startDate: string; // ISO String
    endDate: string;   // ISO String
    allDay?: boolean;
    location?: string;
    description?: string;
    attendees?: {
        email: string;
        displayName?: string;
        responseStatus?: string;
    }[];
    color?: string;
}

// --- Quest Interface ---
export interface IQuestClaim {
    memberId: string;
    claimedAt: string;
    completedAt?: string;
    status: 'claimed' | 'completed' | 'approved';
    pointsAwarded?: number;
}

export interface IQuestRecurrence {
    frequency: 'daily' | 'weekly' | 'monthly';
    resetTime?: string;
    lastReset?: string;
    nextReset?: string;
}

export interface IQuest {
    _id: string;
    householdId: string;
    visibleToHouseholds?: string[];
    title: string;
    description?: string;
    pointsValue: number;
    questType: 'one-time' | 'limited' | 'unlimited';
    maxClaims?: number;
    currentClaims: number;
    claims: IQuestClaim[];
    recurrence?: IQuestRecurrence;
    isActive: boolean;
    expiresAt?: string;
    createdBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    // Virtual
    isClaimable?: boolean;
}

// --- Store Item Interface ---
export interface IStoreItem {
    _id: string;
    itemName: string;
    description: string;
    cost: number;
    isAvailable: boolean;
    stock?: number;
    isInfinite?: boolean;
    householdRefId: string;
    image?: string;
}

// --- Member Interface ---
export interface IHouseholdMemberProfile {
    _id: string; // This is the sub-document ID
    familyMemberId: {
        _id: string;
        firstName: string;
        email?: string; // Populated for parents
    };
    displayName: string;
    role: 'Parent' | 'Child';
    profileColor: string; // Mandatory in backend
    pointsTotal: number;
    focusedTaskId?: string; // ADHD Feature: When set, child sees only this task in Focus Mode
    currentStreak?: number;
    longestStreak?: number;
    streakMultiplier?: number;
    isLinkedChild?: boolean;
}

export interface IHousehold {
    _id: string;
    householdName: string;
    memberProfiles: IHouseholdMemberProfile[];
    familyColor?: string;
    inviteCode?: string;
}

// --- Restaurant Interface ---
export interface IRestaurant {
    _id: string;
    name: string;
    cuisine?: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number; // Kept for UI compatibility if needed, but not in backend model
    priceRange?: '$' | '$$' | '$$$' | '$$$$';
    favoriteOrders?: {
        itemName: string;
        forMemberId?: string;
    }[];
}

// --- Recipe Interface ---
export interface IRecipe {
    _id: string;
    householdId: string;
    name: string;
    description?: string;
    ingredients: string[];
    instructions: string[];
    prepTimeMinutes?: number; // Renamed from prepTime
    cookTimeMinutes?: number; // Renamed from cookTime
    image?: string; // Renamed from imageUrl
    tags: string[];
}

// --- Meal Entry Interface ---
export interface IMealEntry {
    _id: string;
    householdId: string;
    date: Date | string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    itemType: 'Recipe' | 'Restaurant' | 'Custom';
    itemId?: {
        _id: string;
        name?: string;
        description?: string;
    };
    customTitle?: string;
    imageUrl?: string;
    rating?: number;
    isRated?: boolean;
}

// --- Weekly Meal Plan Interface ---
// Note: Backend doesn't strictly have a "WeeklyMealPlan" model visible, 
// usually it's just a collection of MealPlans. Keeping strictly to backend models 
// essentially means working with array of IMealEntry. 
export interface IMealPlan {
    _id: string;
    startDate: string;
    endDate: string;
    meals: IMealEntry[];
}

// --- Routine Interface (Already Aligned) ---
export interface IRoutineItem {
    _id?: string;
    title: string;
    order: number;
    isCompleted: boolean;
    completedAt?: string | Date;
}

export interface IRoutine {
    _id: string;
    householdId: string;
    visibleToHouseholds?: string[];
    memberId: string;
    timeOfDay: 'morning' | 'noon' | 'night';
    title: string;
    items: IRoutineItem[];
    isActive: boolean;
    lastResetDate?: string;
    createdBy: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

// --- Wishlist Item Interface ---
export interface IWishlistItem {
    _id: string;
    memberId: string;
    householdId: string;
    title: string;
    description?: string;
    pointsCost: number; // Renamed from cost
    priority: 'low' | 'medium' | 'high'; // Added
    imageUrl?: string;
    isPurchased: boolean;
    purchasedAt?: string; // Added
}
