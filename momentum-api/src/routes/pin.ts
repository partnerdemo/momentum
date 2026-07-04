// src/routes/pin.ts
import express from 'express';
import rateLimit from 'express-rate-limit';
import { setupPin, verifyPin, changePin, getPinStatus } from '../controllers/pinController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// Strict rate limiter for PIN verification: 5 attempts per 15 minutes per member.
// Keyed on memberId+householdId so limits are per-member, not per IP.
const pinVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => `pin:${req.body?.householdId ?? 'unknown'}:${req.body?.memberId ?? 'unknown'}`,
    message: { status: 'error', message: 'Too many PIN attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const isFourDigitPin = (v: unknown) =>
    typeof v === 'string' && /^\d{4}$/.test(v)
        ? { valid: true }
        : { valid: false, message: 'PIN must be exactly 4 digits' };

const setupPinValidator = validateRequest({
    body: {
        pin: { required: true, custom: isFourDigitPin },
    },
});

const changePinValidator = validateRequest({
    body: {
        oldPin: { required: true, type: 'string' },
        newPin: { required: true, custom: isFourDigitPin },
    },
});

const verifyPinValidator = validateRequest({
    body: {
        pin: { required: true, custom: isFourDigitPin },
        memberId: { required: true, type: 'string' },
        householdId: { required: true, type: 'string' },
    },
});

// Protected routes (require authentication)
router.post('/setup-pin', protect, setupPinValidator, setupPin);
router.put('/change-pin', protect, changePinValidator, changePin);
router.get('/pin-status', protect, getPinStatus);

// Public route (for shared device access) — rate limited to prevent brute force
router.post('/verify-pin', pinVerifyLimiter, verifyPinValidator, verifyPin);

export default router;
