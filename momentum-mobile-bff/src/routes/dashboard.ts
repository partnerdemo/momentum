import { Router, Request, Response, NextFunction } from 'express';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';
import { populateTaskAssignments } from '../utils/populateTaskAssignments';

const router = Router();

interface MemberProfile {
    _id: string;
    familyMemberId: { _id?: string; firstName?: string; lastName?: string } | string;
    displayName?: string;
    profileColor: string;
    pointsTotal: number;
    role: string;
    focusedTaskId?: string;
    isLinkedChild?: boolean;
}

interface HouseholdData {
    _id: string;
    householdName: string;
    memberProfiles?: MemberProfile[];
}

router.get('/page-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        // 1. Fetch Household First (Required for Wishlist)
        logger.info('[DashboardBFF] Fetching household...');
        const householdRes = await fetch(`${API_BASE_URL}/households`, { headers: { 'Authorization': authHeader } });
        const householdData = await householdRes.json() as any;

        // Transform Household Data early to get ID
        let household = null;
        let rawHousehold: HouseholdData | null = null;
        let householdId = '';

        if (householdData.data) {
            if (Array.isArray(householdData.data)) {
                rawHousehold = householdData.data[0];
            } else {
                rawHousehold = householdData.data as HouseholdData;
            }

            if (rawHousehold) {
                householdId = rawHousehold._id;
                household = {
                    id: rawHousehold._id,
                    name: rawHousehold.householdName,
                    members: rawHousehold.memberProfiles?.map((p: MemberProfile) => ({
                        id: p._id,
                        userId: typeof p.familyMemberId === 'object' ? p.familyMemberId._id : p.familyMemberId,
                        firstName: p.displayName || (typeof p.familyMemberId === 'object' ? p.familyMemberId.firstName : ''),
                        lastName: typeof p.familyMemberId === 'object' ? p.familyMemberId.lastName : '',
                        profileColor: p.profileColor,
                        pointsTotal: p.pointsTotal,
                        role: p.role,
                        focusedTaskId: p.focusedTaskId,
                        isLinkedChild: p.isLinkedChild || false
                    })) || []
                };
            }
        }
        logger.info(`[DashboardBFF] Household ID resolved: ${householdId}`);

        // 2. Fetch Everything Else in Parallel with Resiliency
        logger.info('[DashboardBFF] Starting parallel data fetch for tasks, store, quests, routines, meals, restaurants, wishlist, events...');
        const fetchResults = await Promise.allSettled([
            fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/store-items`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/quests`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/routines`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/meals/recipes`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/meals/restaurants`, { headers: { 'Authorization': authHeader } }),
            // Only fetch wishlist if we have a household ID
            householdId ? fetch(`${API_BASE_URL}/wishlist/household/${householdId}`, { headers: { 'Authorization': authHeader } }) : Promise.resolve(null),
            fetch(`${API_BASE_URL}/dashboard/page-data`, { headers: { 'Authorization': authHeader } })
        ]);
        logger.info('[DashboardBFF] Parallel fetch completed.');

        // Helper to safely parse JSON from upstream or use a standard fallback envelope on failure
        const getJsonOrFallback = async (result: PromiseSettledResult<any>, fallback: any) => {
            if (result.status === 'rejected') {
                logger.error('[DashboardBFF] Upstream fetch promise rejected:', result.reason);
                return fallback;
            }
            const resVal = result.value;
            if (!resVal) return fallback; // Resolves null when no householdId is present for wishlist
            try {
                if (!resVal.ok) {
                    logger.warn(`[DashboardBFF] Upstream fetch returned non-2xx status: ${resVal.status} for ${resVal.url}`);
                    return fallback;
                }
                return await resVal.json();
            } catch (err: any) {
                logger.error('[DashboardBFF] Failed parsing JSON from response:', err);
                return fallback;
            }
        };

        const tasksData = await getJsonOrFallback(fetchResults[0], { data: { tasks: [] } });
        const storeData = await getJsonOrFallback(fetchResults[1], { data: { storeItems: [] } });
        const questsData = await getJsonOrFallback(fetchResults[2], { data: { quests: [] } });
        const routinesData = await getJsonOrFallback(fetchResults[3], { data: { routines: [] } });
        const mealsData = await getJsonOrFallback(fetchResults[4], { data: { recipes: [] } });
        const restaurantsData = await getJsonOrFallback(fetchResults[5], { data: { restaurants: [] } });
        const wishlistData = await getJsonOrFallback(fetchResults[6], { data: { wishlistItems: [] } });
        const eventsData = await getJsonOrFallback(fetchResults[7], { data: { events: [] } });

        // Populations
        const memberProfiles = rawHousehold?.memberProfiles || [];
        const populatedTasks = tasksData.data?.tasks
            ? populateTaskAssignments(tasksData.data.tasks, memberProfiles)
            : [];

        console.log('[DashboardBFF] Events from Core API:', eventsData.data?.events?.length || 0);

        res.json({
            status: 'success',
            data: {
                household: household,
                tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
                storeItems: storeData.data?.storeItems || [],
                quests: questsData.data?.quests || [],
                routines: routinesData.data?.routines || [],
                meals: mealsData.data?.recipes || [],
                restaurants: restaurantsData.data?.restaurants || [],
                wishlistItems: wishlistData.data?.wishlistItems || [],
                events: eventsData.data?.events || []
            }
        });
    } catch (error) {
        logger.error('Dashboard BFF Error', { error });
        next(error);
    }
});

export default router;
