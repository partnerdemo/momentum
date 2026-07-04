// src/routes/routineRoutes.ts
import express from 'express';
import {
    createRoutine,
    getAllRoutines,
    getMemberRoutines,
    getRoutineById,
    updateRoutine,
    deleteRoutine,
    toggleRoutineItem,
    resetRoutine,
} from '../controllers/routineController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.use(protect);

const TIME_OF_DAY = new Set(['morning', 'noon', 'night']);

const createRoutineValidator = validateRequest({
    body: {
        title: { required: true, type: 'string' },
        memberId: { required: true, type: 'string' },
        timeOfDay: {
            required: true,
            type: 'string',
            custom: (v: unknown) =>
                typeof v === 'string' && TIME_OF_DAY.has(v)
                    ? { valid: true }
                    : { valid: false, message: "timeOfDay must be one of 'morning' | 'noon' | 'night'" },
        },
        items: { type: 'array' },
    },
});

const updateRoutineValidator = validateRequest({
    body: {
        title: { type: 'string' },
        timeOfDay: {
            type: 'string',
            custom: (v: unknown) =>
                typeof v === 'string' && TIME_OF_DAY.has(v)
                    ? { valid: true }
                    : { valid: false, message: "timeOfDay must be one of 'morning' | 'noon' | 'night'" },
        },
        items: { type: 'array' },
        isActive: { type: 'boolean' },
    },
});

router.route('/')
    .get(getAllRoutines)
    .post(createRoutineValidator, createRoutine);

router.get('/member/:memberId', getMemberRoutines);

router.route('/:id')
    .get(getRoutineById)
    .put(updateRoutineValidator, updateRoutine)
    .delete(deleteRoutine);

router.post('/:id/items/:itemId/toggle', toggleRoutineItem);
router.post('/:id/reset', resetRoutine);

export default router;
