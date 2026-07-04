// src/routes/householdLinkRoutes.ts
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
    generateLinkCode,
    validateLinkCode,
    linkExistingChild,
    getLinkSettings,
    getHouseholdLinks,
    proposeSettingChange,
    approveChange,
    rejectChange,
    unlinkChild,
} from '../controllers/householdLinkController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// All routes require Parent role
router.use(restrictTo('Parent'));

const generateLinkCodeValidator = validateRequest({
    body: {
        childId: { required: true, type: 'string' },
    },
});

const linkExistingChildValidator = validateRequest({
    body: {
        code: { required: true, type: 'string' },
        displayName: { required: true, type: 'string' },
        profileColor: { required: true, type: 'string' },
    },
});

const proposeChangeValidator = validateRequest({
    body: {
        settingPath: { required: true, type: 'string' },
        newValue: { required: true },
    },
});

router.post('/child/generate-link-code', generateLinkCodeValidator, generateLinkCode);
router.post('/child/link-existing', linkExistingChildValidator, linkExistingChild);
router.get('/child/validate-code/:code', validateLinkCode);
router.get('/links', getHouseholdLinks);
router.get('/link/:linkId/settings', getLinkSettings);
router.post('/link/:linkId/propose-change', proposeChangeValidator, proposeSettingChange);
router.post('/link/:linkId/approve-change/:changeId', approveChange);
router.post('/link/:linkId/reject-change/:changeId', rejectChange);
router.post('/child/:childId/unlink', unlinkChild);

export default router;
