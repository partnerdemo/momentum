// src/routes/householdRoutes.ts
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createHousehold,
  getMyHouseholds,
  getHousehold,
  updateHousehold,
  deleteHousehold,
  addMemberToHousehold,
  updateMemberProfile,
  removeMemberFromHousehold,
  getInviteCode,
  regenerateInviteCode,
  joinHousehold,
} from '../controllers/householdController';

const router = express.Router();

// All routes below require a logged-in user, so we apply the 'protect' middleware first.
router.use(protect);

const ROLES = new Set(['Parent', 'Child']);

const createHouseholdValidator = validateRequest({
  body: {
    householdName: { required: true, type: 'string' },
    userDisplayName: { required: true, type: 'string' },
    userProfileColor: { required: true, type: 'string' },
    familyColor: { type: 'string' },
  },
});

const updateHouseholdValidator = validateRequest({
  body: {
    householdName: { type: 'string' },
    familyColor: { type: 'string' },
    familyCalendarId: { type: 'string' },
  },
});

const joinHouseholdValidator = validateRequest({
  body: {
    inviteCode: { required: true, type: 'string' },
    userDisplayName: { type: 'string' },
    userProfileColor: { type: 'string' },
  },
});

const addMemberValidator = validateRequest({
  body: {
    displayName: { required: true, type: 'string' },
    profileColor: { required: true, type: 'string' },
    role: {
      required: true,
      type: 'string',
      custom: (v: unknown) =>
        typeof v === 'string' && ROLES.has(v)
          ? { valid: true }
          : { valid: false, message: "role must be 'Parent' or 'Child'" },
    },
  },
});

const updateMemberValidator = validateRequest({
  body: {
    displayName: { type: 'string' },
    profileColor: { type: 'string' },
    role: {
      type: 'string',
      custom: (v: unknown) =>
        typeof v === 'string' && ROLES.has(v)
          ? { valid: true }
          : { valid: false, message: "role must be 'Parent' or 'Child'" },
    },
  },
});

// -----------------------------------------------------------
// A. Core Household Routes
// -----------------------------------------------------------

router.post('/join', joinHouseholdValidator, joinHousehold);

router.route('/').post(createHouseholdValidator, createHousehold);
router.route('/').get(getMyHouseholds);

router.route('/:id')
  .get(getHousehold)
  .patch(updateHouseholdValidator, updateHousehold)
  .delete(deleteHousehold);

// -----------------------------------------------------------
// B. Invite System Routes
// -----------------------------------------------------------

router.route('/:id/invite-code')
  .get(getInviteCode)
  .post(regenerateInviteCode);

// -----------------------------------------------------------
// C. Household Member Management Routes
// -----------------------------------------------------------

router
  .route('/:householdId/members')
  .post(addMemberValidator, addMemberToHousehold);

router
  .route('/:householdId/members/:memberProfileId')
  .patch(updateMemberValidator, updateMemberProfile);

router
  .route('/:householdId/members/:memberProfileId')
  .delete(removeMemberFromHousehold);

export default router;
