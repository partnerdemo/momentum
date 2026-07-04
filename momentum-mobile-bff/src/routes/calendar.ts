import { Router, Request, Response, NextFunction } from 'express';
import { API_BASE_URL } from '../utils/config';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

const router = Router();

// Get Google OAuth URL
router.get('/google/auth-url', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/auth-url`, {
            headers: { 'Authorization': authHeader }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to get auth URL from API', response.status);
        }

        res.json(data);
    } catch (error) {
        logger.error('Calendar Auth URL BFF Error', { error });
        next(error);
    }
});

// Get Google Calendar Events
router.get('/google/events', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const url = new URL(`${API_BASE_URL}/calendar/google/events`);

        // Forward query parameters (timeMin, timeMax)
        if (req.query) {
            Object.keys(req.query).forEach(key => {
                if (req.query[key]) {
                    url.searchParams.append(key, req.query[key] as string);
                }
            });
        }

        const response = await fetch(url.toString(), {
            headers: { 'Authorization': authHeader }
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('API Error Response', { status: response.status, body: errorText });
            throw new AppError(`Failed to get events from API: ${errorText}`, response.status);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('Calendar Events BFF Error', { error });
        next(error);
    }
});

// Create Google Calendar Event
router.post('/google/events', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/events`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to create event', response.status);
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Create Event BFF Error', { error });
        next(error);
    }
});

// Connect Google Calendar via native sign-in
router.post('/google/connect', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/connect`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to connect Google Calendar', response.status);
        }

        res.json(data);
    } catch (error) {
        logger.error('Calendar Connect BFF Error', { error });
        next(error);
    }
});

// Update Google Calendar Event
router.patch('/google/events/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { id } = req.params;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/events/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to update event', response.status);
        }

        res.json(data);
    } catch (error) {
        logger.error('Update Event BFF Error', { error });
        next(error);
    }
});

// Delete Google Calendar Event
router.delete('/google/events/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const { id } = req.params;

        if (!authHeader) {
            throw new AppError('No authorization header', 401);
        }

        const response = await fetch(`${API_BASE_URL}/calendar/google/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authHeader,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new AppError('Failed to delete event', response.status);
        }

        res.json(data);
    } catch (error) {
        logger.error('Delete Event BFF Error', { error });
        next(error);
    }
});

export default router;
