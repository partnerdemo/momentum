import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
    sendParentReminder,
    getNotifications,
    markAsRead,
    markAllAsRead,
    savePushToken,
} from '../controllers/notificationController';

const router = express.Router();

router.use(protect);

const remindValidator = validateRequest({
    body: {
        memberId: { required: true, type: 'string' },
        message: { type: 'string' },
    },
});

const pushTokenValidator = validateRequest({
    body: {
        token: { required: true, type: 'string' },
    },
});

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/remind', remindValidator, sendParentReminder);
router.post('/push-token', pushTokenValidator, savePushToken);

export default router;
