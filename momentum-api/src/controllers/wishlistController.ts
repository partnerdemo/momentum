// =========================================================
// momentum-api/src/controllers/wishlistController.ts
// Wishlist Management - CRUD operations for wishlist items
// =========================================================
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import WishlistItem from '../models/WishlistItem';
import Household from '../models/Household';
import AppError from '../utils/AppError';

// @desc    Get all wishlist items for a member
// @route   GET /api/v1/wishlist/member/:memberId
// @access  Private
export const getMemberWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { memberId } = req.params;
    const { includePurchased } = req.query;

    const query: any = { memberId };

    // By default, only show unpurchased items
    if (includePurchased !== 'true') {
        query.isPurchased = false;
    }

    const wishlistItems = await WishlistItem.find(query)
        .sort({ priority: -1, createdAt: -1 }); // High priority first, then newest

    // Get member's current points to calculate progress
    const household = await Household.findOne({ 'memberProfiles._id': memberId });
    const member = household?.memberProfiles.find((m: any) => m._id?.toString() === memberId);
    const currentPoints = member?.pointsTotal || 0;

    // Add progress calculation to each item
    const itemsWithProgress = wishlistItems.map(item => ({
        ...item.toObject(),
        progress: Math.min(100, Math.round((currentPoints / item.pointsCost) * 100)),
        canAfford: currentPoints >= item.pointsCost
    }));

    res.status(200).json({
        status: 'success',
        data: {
            wishlistItems: itemsWithProgress,
            currentPoints
        }
    });
});

// @desc    Get all wishlist items for a household
// @route   GET /api/v1/wishlist/household/:householdId
// @access  Private
export const getHouseholdWishlist = asyncHandler(async (req: Request, res: Response) => {
    const { householdId } = req.params;
    const { includePurchased } = req.query;

    const query: any = { householdId };

    // By default, only show unpurchased items
    if (includePurchased !== 'true') {
        query.isPurchased = false;
    }

    const wishlistItems = await WishlistItem.find(query)
        .sort({ priority: -1, createdAt: -1 });

    // We need to calculate progress for each item, which depends on the member's points.
    // Fetch the household to get all members' points at once.
    const household = await Household.findById(householdId);

    if (!household) {
        throw new AppError('Household not found', 404);
    }

    // Create a map of memberId -> points for O(1) lookup
    const memberPointsMap = new Map<string, number>();
    household.memberProfiles.forEach((m: any) => {
        memberPointsMap.set(m._id.toString(), m.pointsTotal || 0);
    });

    const itemsWithProgress = wishlistItems.map(item => {
        const currentPoints = memberPointsMap.get(item.memberId.toString()) || 0;
        return {
            ...item.toObject(),
            progress: Math.min(100, Math.round((currentPoints / item.pointsCost) * 100)),
            canAfford: currentPoints >= item.pointsCost
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            wishlistItems: itemsWithProgress
        }
    });
});

// @desc    Create a new wishlist item
// @route   POST /api/v1/wishlist
// @access  Private
export const createWishlistItem = asyncHandler(async (req: Request, res: Response) => {
    const { memberId, householdId, title, description, pointsCost, imageUrl, priority } = req.body;

    // Validation
    if (!memberId || !householdId || !title || !pointsCost) {
        throw new AppError('Missing required fields: memberId, householdId, title, pointsCost', 400);
    }

    if (pointsCost < 0) {
        throw new AppError('Points cost must be positive', 400);
    }

    // Verify member exists in household
    const household = await Household.findById(householdId);
    if (!household) {
        throw new AppError('Household not found', 404);
    }

    const memberExists = household.memberProfiles.some((m: any) => m._id?.toString() === memberId);
    if (!memberExists) {
        throw new AppError('Member not found in household', 404);
    }

    // Create wishlist item
    const wishlistItem = new WishlistItem({
        memberId,
        householdId,
        title,
        description,
        pointsCost,
        imageUrl,
        priority: priority || 'medium',
        isPurchased: false
    });

    await wishlistItem.save();

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(householdId).emit('wishlist_updated', {
        action: 'created',
        wishlistItem: wishlistItem.toObject()
    });

    res.status(201).json({
        status: 'success',
        data: { wishlistItem }
    });
});

// @desc    Update a wishlist item
// @route   PATCH /api/v1/wishlist/:id
// @access  Private
export const updateWishlistItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, pointsCost, imageUrl, priority } = req.body;

    const wishlistItem = await WishlistItem.findById(id);
    if (!wishlistItem) {
        throw new AppError('Wishlist item not found', 404);
    }

    // Update fields
    if (title !== undefined) wishlistItem.title = title;
    if (description !== undefined) wishlistItem.description = description;
    if (pointsCost !== undefined) {
        if (pointsCost < 0) {
            throw new AppError('Points cost must be positive', 400);
        }
        wishlistItem.pointsCost = pointsCost;
    }
    if (imageUrl !== undefined) wishlistItem.imageUrl = imageUrl;
    if (priority !== undefined) wishlistItem.priority = priority;

    await wishlistItem.save();

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(wishlistItem.householdId.toString()).emit('wishlist_updated', {
        action: 'updated',
        wishlistItem: wishlistItem.toObject()
    });

    res.status(200).json({
        status: 'success',
        data: { wishlistItem }
    });
});

// @desc    Delete a wishlist item
// @route   DELETE /api/v1/wishlist/:id
// @access  Private
export const deleteWishlistItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const wishlistItem = await WishlistItem.findById(id);
    if (!wishlistItem) {
        throw new AppError('Wishlist item not found', 404);
    }

    const householdId = wishlistItem.householdId.toString();
    await WishlistItem.findByIdAndDelete(id);

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(householdId).emit('wishlist_updated', {
        action: 'deleted',
        wishlistItemId: id
    });

    res.status(200).json({
        status: 'success',
        message: 'Wishlist item deleted successfully'
    });
});

// @desc    Mark wishlist item as purchased
// @route   POST /api/v1/wishlist/:id/purchase
// @access  Private
export const markWishlistItemPurchased = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const wishlistItem = await WishlistItem.findById(id);
    if (!wishlistItem) {
        throw new AppError('Wishlist item not found', 404);
    }

    if (wishlistItem.isPurchased) {
        throw new AppError('Wishlist item already marked as purchased', 400);
    }

    // Get member's current points
    const household = await Household.findOne({ 'memberProfiles._id': wishlistItem.memberId });
    const member = household?.memberProfiles.find((m: any) => m._id?.toString() === wishlistItem.memberId.toString());

    if (!member) {
        throw new AppError('Member not found', 404);
    }

    const currentPoints = member.pointsTotal || 0;
    if (currentPoints < wishlistItem.pointsCost) {
        throw new AppError('Insufficient points to purchase this item', 400);
    }

    // Mark as purchased
    wishlistItem.isPurchased = true;
    wishlistItem.purchasedAt = new Date();
    await wishlistItem.save();

    // Deduct points from member
    member.pointsTotal = currentPoints - wishlistItem.pointsCost;
    await household?.save();

    // Emit WebSocket event
    const io = req.app.get('io');
    io.to(wishlistItem.householdId.toString()).emit('wishlist_updated', {
        action: 'purchased',
        wishlistItem: wishlistItem.toObject()
    });

    io.to(wishlistItem.householdId.toString()).emit('memberUpdated', {
        memberId: wishlistItem.memberId.toString(),
        pointsTotal: member.pointsTotal
    });

    res.status(200).json({
        status: 'success',
        data: {
            wishlistItem,
            newPointsTotal: member.pointsTotal
        }
    });
});
