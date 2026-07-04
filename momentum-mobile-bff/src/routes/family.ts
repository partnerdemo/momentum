import { Router, Request, Response, NextFunction } from 'express';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';
import { populateTaskAssignments } from '../utils/populateTaskAssignments';

const router = Router();

router.get('/page-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const fetchResults = await Promise.allSettled([
            fetch(`${API_BASE_URL}/households`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/tasks`, { headers: { 'Authorization': authHeader } }),
            fetch(`${API_BASE_URL}/store-items`, { headers: { 'Authorization': authHeader } })
        ]);

        const getJsonOrFallback = async (result: PromiseSettledResult<any>, fallback: any) => {
            if (result.status === 'rejected') {
                logger.error('[FamilyBFF] Upstream fetch promise rejected:', result.reason);
                return fallback;
            }
            const resVal = result.value;
            if (!resVal) return fallback;
            try {
                if (!resVal.ok) {
                    logger.warn(`[FamilyBFF] Upstream fetch returned non-2xx status: ${resVal.status} for ${resVal.url}`);
                    return fallback;
                }
                return await resVal.json();
            } catch (err: any) {
                logger.error('[FamilyBFF] Failed parsing JSON from response:', err);
                return fallback;
            }
        };

        const householdData = await getJsonOrFallback(fetchResults[0], { data: { memberProfiles: [] } });
        const tasksData = await getJsonOrFallback(fetchResults[1], { data: { tasks: [] } });
        const storeData = await getJsonOrFallback(fetchResults[2], { data: { storeItems: [] } });

        // Extract member profiles for task population
        const rawMemberProfiles = householdData.data?.memberProfiles || [];

        // Transform member profiles to match mobile app expectations
        const memberProfiles = rawMemberProfiles.map((p: any) => ({
            id: p._id,
            _id: p._id,
            userId: typeof p.familyMemberId === 'object' ? p.familyMemberId._id : p.familyMemberId,
            firstName: p.displayName || (typeof p.familyMemberId === 'object' ? p.familyMemberId.firstName : ''),
            lastName: typeof p.familyMemberId === 'object' ? p.familyMemberId.lastName : '',
            profileColor: p.profileColor,
            pointsTotal: p.pointsTotal || 0,
            role: p.role,
            focusedTaskId: p.focusedTaskId,
            isLinkedChild: typeof p.familyMemberId === 'object' && p.familyMemberId.linkedHouseholds && p.familyMemberId.linkedHouseholds.length > 0
        }));

        // Populate task assignments with member details
        const populatedTasks = tasksData.data?.tasks
            ? populateTaskAssignments(tasksData.data.tasks, rawMemberProfiles)
            : [];

        res.json({
            status: 'success',
            data: {
                memberProfiles: memberProfiles,
                tasks: Array.isArray(populatedTasks) ? populatedTasks : [populatedTasks],
                storeItems: storeData.data?.storeItems || []
            }
        });
    } catch (error) {
        logger.error('Failed to fetch family data', { error });
        next(error);
    }
});

// Create Member
router.post('/members', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { householdId, ...memberData } = req.body;

        if (!authHeader) throw new AppError('No authorization header', 401);
        if (!householdId) throw new AppError('Household ID is required', 400);

        const response = await fetch(`${API_BASE_URL}/households/${householdId}/members`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        const data = await response.json() as any;
        if (!response.ok) throw new AppError(data.message || 'Failed to create member', response.status);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Update Member
router.put('/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { memberId } = req.params;
        const { householdId, ...memberData } = req.body;

        if (!authHeader) throw new AppError('No authorization header', 401);
        if (!householdId) throw new AppError('Household ID is required', 400);

        const response = await fetch(`${API_BASE_URL}/households/${householdId}/members/${memberId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        const data = await response.json() as any;
        if (!response.ok) throw new AppError(data.message || 'Failed to update member', response.status);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Delete Member
router.delete('/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { memberId } = req.params;
        const { householdId } = req.body; // householdId usually needed for sub-resource deletion logic or permission check

        if (!authHeader) throw new AppError('No authorization header', 401);
        if (!householdId) throw new AppError('Household ID is required', 400);

        const response = await fetch(`${API_BASE_URL}/households/${householdId}/members/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ householdId }) // Pass it if needed by API, or just URL
        });

        if (response.status === 204) {
            res.status(204).send();
            return;
        }

        const data = await response.json() as any;
        if (!response.ok) throw new AppError(data.message || 'Failed to delete member', response.status);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

export default router;
