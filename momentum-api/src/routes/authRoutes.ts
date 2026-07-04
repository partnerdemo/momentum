// silkpanda/momentum-api/momentum-api-556c5b7b5d534751fdc505eedf6113f20a02cc98/src/routes/authRoutes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware';
import { signup, login, getMe } from '../controllers/authController'; // Import all Auth controllers
import { googleAuth, googleOAuth, completeOnboarding } from '../controllers/googleAuthController';
// Removed imports for createHousehold, addFamilyMember

// Mandatory camelCase variable name for the Router instance
const router = Router();

// Strict rate limiter for auth endpoints: 30 attempts per 15 minutes per IP.
// This protects login, signup, and Google OAuth from brute-force attacks.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: { status: 'error', message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Non-protected routes (Auth) — rate limited
// POST /api/v1/auth/signup (Parent Sign-Up)
// POST /api/v1/auth/login (Parent Login)
// POST /api/v1/auth/google (Google OAuth - ID token flow)
// POST /api/v1/auth/google/oauth (Google OAuth - Full OAuth flow with calendar)
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/google/oauth', authLimiter, googleOAuth);


// All routes after this middleware will be protected by JWT
router.use(protect);

// Protected health check route: GET /api/v1/auth/me
router.get('/me', getMe);
router.post('/onboarding/complete', completeOnboarding);

// NOTE: All previously misplaced household/member management routes are now in householdRoutes.ts

export default router;