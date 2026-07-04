import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
    getRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getMealPlans,
    createMealPlan,
    deleteMealPlan,
    addMealToPlan,
    removeMealFromPlan,
    getUnratedMeals,
    rateMeal,
} from '../controllers/mealController';

const router = express.Router();

router.use(protect);

const MEAL_TYPES = new Set(['Breakfast', 'Lunch', 'Dinner', 'Snack']);
const ITEM_TYPES = new Set(['Recipe', 'Restaurant', 'Custom']);

const createRecipeValidator = validateRequest({
    body: {
        name: { required: true, type: 'string' },
        ingredients: { type: 'array' },
        instructions: { type: 'array' },
        description: { type: 'string' },
        prepTimeMinutes: { type: 'number' },
        cookTimeMinutes: { type: 'number' },
        image: { type: 'string' },
        tags: { type: 'array' },
    },
});

const updateRecipeValidator = validateRequest({
    body: {
        name: { type: 'string' },
        ingredients: { type: 'array' },
        instructions: { type: 'array' },
        description: { type: 'string' },
        prepTimeMinutes: { type: 'number' },
        cookTimeMinutes: { type: 'number' },
        image: { type: 'string' },
        tags: { type: 'array' },
    },
});

const createRestaurantValidator = validateRequest({
    body: {
        name: { required: true, type: 'string' },
        cuisine: { type: 'string' },
        address: { type: 'string' },
        phone: { type: 'string' },
        website: { type: 'string' },
        priceRange: { type: 'string' },
    },
});

const updateRestaurantValidator = validateRequest({
    body: {
        name: { type: 'string' },
        cuisine: { type: 'string' },
        address: { type: 'string' },
        phone: { type: 'string' },
        website: { type: 'string' },
        priceRange: { type: 'string' },
    },
});

const isParseableDate = (v: unknown) =>
    (typeof v === 'string' || typeof v === 'number') && !Number.isNaN(new Date(v as string).getTime())
        ? { valid: true }
        : { valid: false, message: 'must be an ISO date string or epoch milliseconds' };

const createMealPlanValidator = validateRequest({
    body: {
        startDate: { required: true, custom: isParseableDate },
        endDate: { required: true, custom: isParseableDate },
    },
});

const addMealValidator = validateRequest({
    body: {
        date: { required: true, custom: isParseableDate },
        mealType: {
            required: true,
            type: 'string',
            custom: (v: unknown) =>
                typeof v === 'string' && MEAL_TYPES.has(v)
                    ? { valid: true }
                    : { valid: false, message: 'mealType must be Breakfast | Lunch | Dinner | Snack' },
        },
        itemType: {
            required: true,
            type: 'string',
            custom: (v: unknown) =>
                typeof v === 'string' && ITEM_TYPES.has(v)
                    ? { valid: true }
                    : { valid: false, message: 'itemType must be Recipe | Restaurant | Custom' },
        },
        itemId: { type: 'string' },
        customTitle: { type: 'string' },
    },
});

const rateMealValidator = validateRequest({
    body: {
        rating: {
            required: true,
            type: 'number',
            custom: (v: unknown) =>
                typeof v === 'number' && v >= 1 && v <= 5
                    ? { valid: true }
                    : { valid: false, message: 'rating must be a number 1–5' },
        },
    },
});

// Recipes
router.route('/recipes')
    .get(getRecipes)
    .post(createRecipeValidator, createRecipe);
router.route('/recipes/:id')
    .put(updateRecipeValidator, updateRecipe)
    .delete(deleteRecipe);

// Restaurants
router.route('/restaurants')
    .get(getRestaurants)
    .post(createRestaurantValidator, createRestaurant);
router.route('/restaurants/:id')
    .put(updateRestaurantValidator, updateRestaurant)
    .delete(deleteRestaurant);

// Meal Plans
router.route('/plans')
    .get(getMealPlans)
    .post(createMealPlanValidator, createMealPlan);
router.route('/plans/:id')
    .delete(deleteMealPlan);

router.route('/plans/:planId/meals')
    .post(addMealValidator, addMealToPlan);

router.route('/plans/:planId/meals/:mealId')
    .delete(removeMealFromPlan);

// Ratings
router.get('/unrated', getUnratedMeals);
router.post('/rate/:mealId', rateMealValidator, rateMeal);

export default router;
