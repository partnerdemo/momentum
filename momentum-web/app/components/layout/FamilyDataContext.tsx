'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useSession } from './SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe, IMealPlan, IQuest, IRoutine, IRestaurant } from '../../types';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { useSocketContext } from '../../../lib/providers/SocketProvider';
import { SOCKET_EVENTS, TaskUpdatedEvent, MemberPointsUpdatedEvent, StoreItemUpdatedEvent, HouseholdUpdatedEvent, QuestUpdatedEvent, RoutineUpdatedEvent, MealPlanUpdatedEvent } from '../../../lib/socket';

interface FamilyData {
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

export const FamilyDataContext = createContext<FamilyData | undefined>(undefined);

export const useFamilyDataContext = () => {
    const context = useContext(FamilyDataContext);
    if (!context) {
        throw new Error('useFamilyDataContext must be used within a FamilyDataProvider');
    }
    return context;
};

interface FamilyDataProviderProps {
    children: ReactNode;
}

export const FamilyDataProvider: React.FC<FamilyDataProviderProps> = ({ children }) => {
    const { token, householdId } = useSession();
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [quests, setQuests] = useState<IQuest[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [mealPlans, setMealPlans] = useState<IMealPlan[]>([]);
    const [recipes, setRecipes] = useState<IRecipe[]>([]);
    const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
    const [routines, setRoutines] = useState<IRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const addTask = useCallback((task: ITask) => {
        setTasks(prev => [task, ...prev]);
    }, []);

    const updateTask = useCallback((taskId: string, updates: Partial<ITask>) => {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
    }, []);

    const fetchData = useCallback(async (showLoading = true) => {
        if (!token || !householdId) {
            setLoading(false);
            return;
        }

        if (showLoading) setLoading(true);
        setError(null);

        // Dev Mock Fallback Handler
        const loadMockData = () => {
            console.log('[FamilyDataContext] Loading local development mock data...');
            setMembers([
                {
                    _id: 'mock-parent-id-1',
                    displayName: 'Sarah',
                    role: 'Parent',
                    profileColor: '#e11d48',
                    currentStreak: 5,
                    pointsTotal: 1500,
                    familyMemberId: { _id: 'mock-parent-member-1', firstName: 'Sarah', email: 'sarah.panda@example.com' }
                },
                {
                    _id: 'mock-parent-id-2',
                    displayName: 'Mark',
                    role: 'Parent',
                    profileColor: '#2563eb',
                    currentStreak: 3,
                    pointsTotal: 900,
                    familyMemberId: { _id: 'mock-parent-member-2', firstName: 'Mark', email: 'mark.panda@example.com' }
                },
                {
                    _id: 'mock-child-id-1',
                    displayName: 'Leo',
                    role: 'Child',
                    profileColor: '#10b981',
                    currentStreak: 8,
                    pointsTotal: 420,
                    focusedTaskId: 'mock-task-id-2',
                    familyMemberId: { _id: 'mock-child-member-1', firstName: 'Leo' }
                },
                {
                    _id: 'mock-child-id-2',
                    displayName: 'Maya',
                    role: 'Child',
                    profileColor: '#d97706',
                    currentStreak: 12,
                    pointsTotal: 1250,
                    familyMemberId: { _id: 'mock-child-member-2', firstName: 'Maya' }
                }
            ]);

            setTasks([
                {
                    _id: 'mock-task-id-1',
                    householdId: 'mock-household-id',
                    title: 'Feed the puppy and clean water bowl',
                    pointsValue: 50,
                    status: 'Pending',
                    assignedTo: [{ _id: 'mock-child-id-1', displayName: 'Leo', profileColor: '#10b981' }],
                    isRecurring: true,
                    createdAt: new Date().toISOString()
                },
                {
                    _id: 'mock-task-id-2',
                    householdId: 'mock-household-id',
                    title: 'Practice piano for 20 minutes',
                    pointsValue: 100,
                    status: 'Pending',
                    assignedTo: [{ _id: 'mock-child-id-1', displayName: 'Leo', profileColor: '#10b981' }],
                    isRecurring: true,
                    createdAt: new Date().toISOString()
                },
                {
                    _id: 'mock-task-id-3',
                    householdId: 'mock-household-id',
                    title: 'Put away clean laundry',
                    pointsValue: 40,
                    status: 'PendingApproval',
                    assignedTo: [{ _id: 'mock-child-id-2', displayName: 'Maya', profileColor: '#d97706' }],
                    isRecurring: true,
                    createdAt: new Date().toISOString(),
                    completedBy: 'mock-child-id-2'
                },
                {
                    _id: 'mock-task-id-4',
                    householdId: 'mock-household-id',
                    title: 'Take out the trash and recycling',
                    pointsValue: 30,
                    status: 'Pending',
                    assignedTo: [{ _id: 'mock-child-id-2', displayName: 'Maya', profileColor: '#d97706' }],
                    isRecurring: true,
                    createdAt: new Date().toISOString()
                }
            ]);

            setQuests([
                {
                    _id: 'mock-quest-id-1',
                    householdId: 'mock-household-id',
                    title: 'Clean the garden shed (Epic Quest)',
                    pointsValue: 300,
                    questType: 'one-time',
                    currentClaims: 0,
                    claims: [],
                    isActive: true,
                    description: 'Organize all tools and sweep the floor.'
                },
                {
                    _id: 'mock-quest-id-2',
                    householdId: 'mock-household-id',
                    title: 'Help cook dinner tonight',
                    pointsValue: 150,
                    questType: 'limited',
                    currentClaims: 0,
                    claims: [],
                    isActive: true,
                    description: 'Help prep vegetables or set the table.'
                }
            ]);

            setStoreItems([
                {
                    _id: 'mock-item-id-1',
                    itemName: 'Extra 30 mins Screen Time',
                    cost: 150,
                    description: 'Valid for gaming or tablet time.',
                    isAvailable: true,
                    householdRefId: 'mock-household-id'
                },
                {
                    _id: 'mock-item-id-2',
                    itemName: 'Friday Pizza Party Choice',
                    cost: 400,
                    description: 'Pick the toppings for this weeks pizza night!',
                    isAvailable: true,
                    householdRefId: 'mock-household-id'
                },
                {
                    _id: 'mock-item-id-3',
                    itemName: 'New LEGO Star Wars Set',
                    cost: 1000,
                    description: 'Ordered directly to the house.',
                    isAvailable: true,
                    householdRefId: 'mock-household-id'
                }
            ]);

            setMealPlans(prev => {
                if (prev.length > 0) return prev;
                
                const today = new Date();
                const currentDay = today.getDay();
                const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
                const startDate = new Date(today);
                startDate.setDate(today.getDate() + distanceToMonday);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);

                const sDateString = startDate.toISOString().split('T')[0];
                const eDateString = endDate.toISOString().split('T')[0];

                const mockMeals: any[] = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    const dIso = d.toISOString();
                    mockMeals.push({ _id: `temp_b_${i}`, date: dIso, mealType: 'Breakfast', customTitle: 'Blueberry Pancakes', itemType: 'Custom', imageUrl: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=500&q=80' });
                    mockMeals.push({ _id: `temp_l_${i}`, date: dIso, mealType: 'Lunch', customTitle: 'Quinoa Power Bowls', itemType: 'Custom', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80' });
                    mockMeals.push({ _id: `temp_d_${i}`, date: dIso, mealType: 'Dinner', customTitle: 'Homemade Lasagna', itemType: 'Custom', imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=500&q=80' });
                }

                return [{
                    _id: 'mock-meal-plan-1',
                    householdId: 'mock-household-id',
                    startDate: sDateString + 'T00:00:00.000Z',
                    endDate: eDateString + 'T23:59:59.999Z',
                    meals: mockMeals
                } as any];
            });

            setRecipes(prev => prev.length > 0 ? prev : [
                { _id: 'mock-recipe-1', name: 'Spaghetti Bolognese', image: 'https://images.unsplash.com/photo-1626844131082-256783844137?auto=format&fit=crop&w=500&q=80' } as any,
                { _id: 'mock-recipe-2', name: 'Chicken Tacos', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=80' } as any
            ]);

            setRestaurants(prev => prev.length > 0 ? prev : [
                { _id: 'mock-rest-1', name: 'Pizza Hut' } as any,
                { _id: 'mock-rest-2', name: 'McDonalds' } as any
            ]);

            setRoutines([
                {
                    _id: 'mock-routine-id-1',
                    title: 'Morning Routine',
                    items: ['Brush teeth', 'Make bed', 'Pack backpack']
                } as any
            ]);

            setError(null);
            if (showLoading) setLoading(false);
        };

        if (token === 'mock_development_token') {
            loadMockData();
            return;
        }

        try {
            const response = await fetch('/web-bff/family/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch family data');
            }

            const data = await response.json();

            if (data.memberProfiles && data.tasks && data.storeItems) {
                setMembers(data.memberProfiles);
                setTasks(data.tasks);
                setQuests(data.quests || []);
                setStoreItems(data.storeItems);
                setMealPlans(data.mealPlans || []);
                setRecipes(data.recipes || []);
                setRestaurants(data.restaurants || []);
                setRoutines(data.routines || []);
            } else {
                throw new Error('Invalid data structure');
            }

        } catch (e: any) {
            console.error('[FamilyDataContext] Fetch failed, checking dev environment:', e.message);
            if (process.env.NODE_ENV === 'development') {
                loadMockData();
            } else {
                setError(e.message);
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData(true); // Initial load with spinner
    }, [fetchData]);

    useEffect(() => {
        if (token === 'mock_development_token' && typeof window !== 'undefined') {
            const originalFetch = window.fetch;
            window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = typeof input === 'string' ? input : input.toString();
                
                // Mock adding a meal
                if (url.includes('/meals/plans/') && init?.method === 'POST') {
                    const body = JSON.parse(init.body as string);
                    const planId = url.split('/plans/')[1].split('/')[0];
                    
                    // Simulate Mongoose populate() for recipes and restaurants
                    let populatedItemId = body.itemId;
                    if (body.itemType === 'Recipe' && body.itemId) {
                        const recipe = recipes.find(r => r._id === body.itemId);
                        if (recipe) populatedItemId = recipe;
                    } else if (body.itemType === 'Restaurant' && body.itemId) {
                        const restaurant = restaurants.find(r => r._id === body.itemId);
                        if (restaurant) populatedItemId = restaurant;
                    }

                    const newMeal = {
                        _id: `mock-meal-${Date.now()}`,
                        ...body,
                        itemId: populatedItemId
                    };
                    
                    setMealPlans(prev => prev.map(plan => {
                        if (plan._id === planId) {
                            // Clear out any old meal in this exact slot (especially temp ones) before adding the new one
                            const filteredMeals = (plan.meals || []).filter((m: any) => 
                                !(m.date.split('T')[0] === newMeal.date.split('T')[0] && m.mealType === newMeal.mealType)
                            );
                            return { ...plan, meals: [...filteredMeals, newMeal] };
                        }
                        return plan;
                    }));
                    
                    return new Response(JSON.stringify(newMeal), { status: 201 });
                }
                
                // Mock deleting a meal
                if (url.includes('/meals/plans/') && init?.method === 'DELETE') {
                    const planId = url.split('/plans/')[1].split('/meals/')[0];
                    const mealId = url.split('/meals/')[1];
                    
                    setMealPlans(prev => prev.map(plan => {
                        if (plan._id === planId) {
                            return { ...plan, meals: plan.meals.filter((m: any) => m._id !== mealId) };
                        }
                        return plan;
                    }));
                    
                    return new Response(null, { status: 204 });
                }
                
                return originalFetch(input, init);
            };
            
            return () => {
                window.fetch = originalFetch;
            };
        }
    }, [token, recipes, restaurants]);

    // WebSocket Listeners
    const { socket, isConnected } = useSocketContext(); // We need socket instance to emit join

    useEffect(() => {
        if (socket && isConnected && householdId) {
            console.log(`[FamilyDataContext] Joining household room: ${householdId} (Socket ID: ${socket.id})`);
            socket.emit('join_household', householdId);
        } else {
            console.log('[FamilyDataContext] Waiting to join room...', {
                hasSocket: !!socket,
                connected: isConnected,
                hasHouseholdId: !!householdId
            });
        }
    }, [socket, isConnected, householdId]);

    // Re-join on reconnect
    useEffect(() => {
        if (!socket) return;
        const onConnect = () => {
            if (householdId) {
                console.log('[FamilyDataContext] Re-joining household room after reconnect:', householdId);
                socket.emit('join_household', householdId);
            }
        }
        socket.on('connect', onConnect);
        return () => { socket.off('connect', onConnect); }
    }, [socket, householdId]);

    useSocketEvent<MealPlanUpdatedEvent>(SOCKET_EVENTS.MEAL_PLAN_UPDATED, (data) => {
        console.log('[WebSocket] Meal Plan Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
        console.log('[WebSocket] Task Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<MemberPointsUpdatedEvent>(SOCKET_EVENTS.MEMBER_POINTS_UPDATED, (data) => {
        console.log('[WebSocket] Member Points Updated:', data);
        if (data.householdId === householdId) {
            setMembers(prev => prev.map(m =>
                m.familyMemberId._id === data.memberId
                    ? { ...m, pointsTotal: data.pointsTotal }
                    : m
            ));
        }
    });

    useSocketEvent<StoreItemUpdatedEvent>(SOCKET_EVENTS.STORE_ITEM_UPDATED, (data) => {
        console.log('[WebSocket] Store Item Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<QuestUpdatedEvent>(SOCKET_EVENTS.QUEST_UPDATED, (data) => {
        console.log('[WebSocket] Quest Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<RoutineUpdatedEvent>(SOCKET_EVENTS.ROUTINE_UPDATED, (data) => {
        console.log('[WebSocket] Routine Updated:', data);
        fetchData(false); // Silent refresh
    });

    useSocketEvent<HouseholdUpdatedEvent>(SOCKET_EVENTS.HOUSEHOLD_UPDATED, (data) => {
        console.log('[WebSocket] Household Updated:', data);
        if (data.householdId === householdId) {
            fetchData(false); // Silent refresh
        }
    });
    const value = {
        members,
        tasks,
        quests,
        storeItems,
        mealPlans,
        recipes,
        routines,
        restaurants,
        loading,
        error,
        addTask,
        updateTask,
        refresh: () => fetchData(false) // Default exposed refresh is silent
    };

    return (
        <FamilyDataContext.Provider value={value}>
            {children}
        </FamilyDataContext.Provider>
    );
};
