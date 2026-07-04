import { Router, Request, Response, NextFunction } from 'express';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

const router = Router();

/**
 * GET /mobile-bff/members
 *
 * Returns the current household's memberProfiles. The current household is the
 * one bound to the user's JWT — the API resolves it server-side via
 * GET /api/v1/households (which despite its plural name returns the single
 * household associated with `req.householdId` from the token).
 *
 * Previously this called `/households/me` which is not a defined route and was
 * silently 404-ing, so the mobile client always saw an empty members list.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/households`, {
            headers: { Authorization: auth },
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            const message =
                (body as { message?: string }).message ||
                `Upstream /households returned ${response.status}`;
            logger.warn(`[members] Upstream failed: ${response.status} — ${message}`);
            throw new AppError(message, response.status);
        }

        const data = (await response.json()) as { data?: { memberProfiles?: unknown[] } };

        res.json({
            status: 'success',
            data: {
                memberProfiles: data.data?.memberProfiles ?? [],
            },
        });
    } catch (error) {
        logger.error('Failed to fetch members', { error });
        next(error);
    }
});

export default router;
