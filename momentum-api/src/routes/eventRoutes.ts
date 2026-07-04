// src/routes/eventRoutes.ts
import express from 'express';
import {
    createEvent,
    getEvents,
    getEvent,
    updateEvent,
    deleteEvent,
} from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(protect);

const isParseableDate = (v: unknown) =>
    (typeof v === 'string' || typeof v === 'number') && !Number.isNaN(new Date(v as string).getTime())
        ? { valid: true }
        : { valid: false, message: 'must be an ISO date string or epoch milliseconds' };

const createEventValidator = validateRequest({
    body: {
        title: { required: true, type: 'string' },
        startDate: { required: true, custom: isParseableDate },
        endDate: { required: true, custom: isParseableDate },
        description: { type: 'string' },
        location: { type: 'string' },
        videoLink: { type: 'string' },
        allDay: { type: 'boolean' },
        attendees: { type: 'array' },
        color: { type: 'string' },
    },
});

const updateEventValidator = validateRequest({
    body: {
        title: { type: 'string' },
        startDate: { custom: isParseableDate },
        endDate: { custom: isParseableDate },
        description: { type: 'string' },
        location: { type: 'string' },
        videoLink: { type: 'string' },
        allDay: { type: 'boolean' },
        attendees: { type: 'array' },
        color: { type: 'string' },
    },
});

// Event CRUD
router.route('/')
    .get(getEvents)
    .post(createEventValidator, createEvent);

router.route('/:id')
    .get(getEvent)
    .patch(updateEventValidator, updateEvent)
    .delete(deleteEvent);

export default router;
