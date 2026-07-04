import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import * as questController from '../controllers/questController';

const router = express.Router();

// All quest routes are protected
router.use(protect);

const createQuestValidator = validateRequest({
    body: {
        title: { required: true, type: 'string' },
        pointsValue: { required: true, type: 'number' },
        questType: { type: 'string' },
        maxClaims: { type: 'number' },
        description: { type: 'string' },
    },
});

const updateQuestValidator = validateRequest({
    body: {
        title: { type: 'string' },
        pointsValue: { type: 'number' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
    },
});

const memberIdValidator = validateRequest({
    body: {
        memberId: { required: true, type: 'string', message: 'memberId is required (string)' },
    },
});

router
    .route('/')
    .get(questController.getAllQuests)
    .post(createQuestValidator, questController.createQuest);

router
    .route('/:id')
    .put(updateQuestValidator, questController.updateQuest)
    .delete(questController.deleteQuest);

// Quest Action Routes
router.post('/:id/claim', memberIdValidator, questController.claimQuest);
router.post('/:id/complete', memberIdValidator, questController.completeQuest);
router.post('/:id/approve', memberIdValidator, questController.approveQuest);

export default router;
