// =========================================================
// momentum-api/src/routes/wishlistRoutes.ts
// Wishlist API Routes
// =========================================================
import express from 'express';
import {
    getMemberWishlist,
    getHouseholdWishlist,
    createWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    markWishlistItemPurchased,
} from '../controllers/wishlistController';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(protect);

const PRIORITIES = new Set(['low', 'medium', 'high']);

const positiveNumber = (v: unknown) =>
    typeof v === 'number' && v > 0
        ? { valid: true }
        : { valid: false, message: 'pointsCost must be a positive number' };

const createWishlistValidator = validateRequest({
    body: {
        memberId: { required: true, type: 'string' },
        householdId: { required: true, type: 'string' },
        title: { required: true, type: 'string' },
        pointsCost: { required: true, type: 'number', custom: positiveNumber },
        description: { type: 'string' },
        imageUrl: { type: 'string' },
        priority: {
            type: 'string',
            custom: (v: unknown) =>
                typeof v === 'string' && PRIORITIES.has(v)
                    ? { valid: true }
                    : { valid: false, message: "priority must be one of 'low' | 'medium' | 'high'" },
        },
    },
});

const updateWishlistValidator = validateRequest({
    body: {
        title: { type: 'string' },
        pointsCost: { type: 'number', custom: positiveNumber },
        description: { type: 'string' },
        imageUrl: { type: 'string' },
        priority: {
            type: 'string',
            custom: (v: unknown) =>
                typeof v === 'string' && PRIORITIES.has(v)
                    ? { valid: true }
                    : { valid: false, message: "priority must be one of 'low' | 'medium' | 'high'" },
        },
    },
});

// Get household's wishlist (Optimized)
router.get('/household/:householdId', getHouseholdWishlist);

// Get member's wishlist
router.get('/member/:memberId', getMemberWishlist);

// Create wishlist item
router.post('/', createWishlistValidator, createWishlistItem);

// Update wishlist item
router.put('/:id', updateWishlistValidator, updateWishlistItem);

// Delete wishlist item
router.delete('/:id', deleteWishlistItem);

// Mark wishlist item as purchased
router.post('/:id/purchase', markWishlistItemPurchased);

export default router;
