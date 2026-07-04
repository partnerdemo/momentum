// =========================================================
// silkpanda/momentum/app/web-bff/family/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Family View" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';
import { populateTaskAssignments } from '../../utils/populateTaskAssignments';

export const dynamic = 'force-dynamic';

// Internal API URLs
const AUTH_ME_URL = `${API_BASE_URL}/auth/me`;
const TASK_API_URL = `${API_BASE_URL}/tasks`;
const QUEST_API_URL = `${API_BASE_URL}/quests`;
const STORE_API_URL = `${API_BASE_URL}/store-items`;
const ROUTINE_API_URL = `${API_BASE_URL}/routines`;

/**
 * @desc    Get all data for the Family View page
 * @route   GET /web-bff/family/page-data
 * @access  Private (via DashboardLayout)
 */
export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // Direct mock interceptor in development mode
    if (authorization === 'Bearer mock_development_token' || process.env.NODE_ENV === 'development' && authorization === 'Bearer mock_development_token') {
        console.log('[BFF page-data] Dev Mode: Serving mock family page data directly');
        return NextResponse.json({
            memberProfiles: [
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
            ],
            currentUser: {
                _id: 'mock-parent-id-1',
                firstName: 'Sarah',
                role: 'Parent',
            },
            tasks: [
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
            ],
            quests: [
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
            ],
            storeItems: [
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
            ],
            mealPlans: [
                {
                    _id: 'mock-meal-plan-1',
                    breakfast: 'Blueberry Pancakes',
                    lunch: 'Quinoa Power Bowls',
                    dinner: 'Homemade Lasagna'
                }
            ],
            recipes: [],
            restaurants: [],
            routines: [
                {
                    _id: 'mock-routine-id-1',
                    title: 'Morning Routine',
                    items: ['Brush teeth', 'Make bed', 'Pack backpack']
                }
            ]
        });
    }

    try {
        // 1. First, get user data to extract householdId
        const meResponse = await fetch(AUTH_ME_URL, {
            headers: { 'Authorization': authorization }
        });

        if (!meResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const meData = await meResponse.json();
        const householdId = meData.data.householdId;

        if (!householdId) {
            throw new Error('No household ID found for user');
        }

        // 2. Make parallel calls to the internal 'momentum-api' with the householdId
        const [householdResponse, taskResponse, questResponse, storeResponse, mealPlansResponse, recipesResponse, restaurantsResponse, routineResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/households/${householdId}`, {
                headers: { 'Authorization': authorization },
                cache: 'no-store'
            }),
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
            fetch(QUEST_API_URL, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
            fetch(STORE_API_URL, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
            fetch(`${API_BASE_URL}/meals/plans`, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
            fetch(`${API_BASE_URL}/meals/recipes`, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
            fetch(`${API_BASE_URL}/meals/restaurants`, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
            fetch(ROUTINE_API_URL, { headers: { 'Authorization': authorization }, cache: 'no-store' }),
        ]);

        // 3. Check all responses
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');
        if (!taskResponse.ok) throw new Error('Failed to fetch task data');
        if (!storeResponse.ok) throw new Error('Failed to fetch store item data');
        // routines are optional, don't throw if missing, but we expect it to work

        // 4. Parse data
        const householdData = await householdResponse.json();
        const taskData = await taskResponse.json();
        const questData = questResponse.ok ? await questResponse.json() : { data: { quests: [] } };
        const storeData = await storeResponse.json();
        const mealPlansData = mealPlansResponse.ok ? await mealPlansResponse.json() : { data: { mealPlans: [] } };
        const recipesData = recipesResponse.ok ? await recipesResponse.json() : { data: { recipes: [] } };
        const restaurantsData = restaurantsResponse.ok ? await restaurantsResponse.json() : { data: { restaurants: [] } };
        const routineData = routineResponse.ok ? await routineResponse.json() : { data: { routines: [] } };

        // 5. Populate task assignments with member details
        const memberProfiles = householdData.data.memberProfiles || [];
        const populatedTasks = taskData.data.tasks
            ? populateTaskAssignments(taskData.data.tasks, memberProfiles)
            : [];

        // 6. Aggregate and return the combined data
        return NextResponse.json({
            memberProfiles: memberProfiles,
            currentUser: meData.data.user, // Pass current user data (includes pinSetupCompleted)
            tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
            quests: questData.data.quests || [],
            storeItems: storeData.data.storeItems || [],
            mealPlans: mealPlansData.data.mealPlans || [],
            recipes: recipesData.data.recipes || [],
            restaurants: restaurantsData.data.restaurants || [],
            routines: routineData.data.routines || [],
        });

    } catch (err: any) {
        console.error('[BFF page-data Fetch Error]:', err);
        if (process.env.NODE_ENV === 'development') {
            console.log('[BFF page-data] Dev Mode Fallback: Backend failed or offline, returning mock data.');
            return NextResponse.json({
                memberProfiles: [
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
                ],
                currentUser: {
                    _id: 'mock-parent-id-1',
                    firstName: 'Sarah',
                    role: 'Parent',
                },
                tasks: [
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
                ],
                quests: [
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
                ],
                storeItems: [
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
                ],
                mealPlans: [
                    {
                        _id: 'mock-meal-plan-1',
                        breakfast: 'Blueberry Pancakes',
                        lunch: 'Quinoa Power Bowls',
                        dinner: 'Homemade Lasagna'
                    }
                ],
                recipes: [],
                restaurants: [],
                routines: [
                    {
                        _id: 'mock-routine-id-1',
                        title: 'Morning Routine',
                        items: ['Brush teeth', 'Make bed', 'Pack backpack']
                    }
                ]
            });
        }
        return NextResponse.json({ message: 'BFF Error: Failed to fetch family page data', error: err.message }, { status: 500 });
    }
}