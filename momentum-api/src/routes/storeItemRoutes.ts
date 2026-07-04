import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createStoreItem,
  getAllStoreItems,
  getStoreItem,
  updateStoreItem,
  deleteStoreItem,
} from '../controllers/storeItemController';
import { purchaseStoreItem } from '../controllers/transactionController';

const router = Router();

// 1. All routes require login
router.use(protect);

const nonNegativeNumber = (v: unknown) =>
  typeof v === 'number' && v >= 0
    ? { valid: true }
    : { valid: false, message: 'cost must be a non-negative number' };

const createStoreItemValidator = validateRequest({
  body: {
    itemName: { required: true, type: 'string' },
    cost: { required: true, type: 'number', custom: nonNegativeNumber },
    description: { type: 'string' },
    stock: { type: 'number' },
    isInfinite: { type: 'boolean' },
    isAvailable: { type: 'boolean' },
  },
});

const updateStoreItemValidator = validateRequest({
  body: {
    itemName: { type: 'string' },
    cost: { type: 'number', custom: nonNegativeNumber },
    description: { type: 'string' },
    stock: { type: 'number' },
    isInfinite: { type: 'boolean' },
    isAvailable: { type: 'boolean' },
  },
});

// 2. Public Routes (Parent & Child)
// Children must see the store to buy things!
router.route('/')
    .get(getAllStoreItems)
    .post(restrictTo('Parent'), createStoreItemValidator, createStoreItem); // Only Parents stock the store

router.route('/:id')
    .get(getStoreItem)
    .patch(restrictTo('Parent'), updateStoreItemValidator, updateStoreItem)
    .delete(restrictTo('Parent'), deleteStoreItem);

// 3. Purchase Route (Anyone can buy if they have points)
router.route('/:id/purchase')
    .post(purchaseStoreItem);

export default router;
