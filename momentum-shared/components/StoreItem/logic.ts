import { StoreItem, StoreItemCardState } from './types';

/**
 * Get store item ID (handles both _id and id fields)
 */
export const getStoreItemId = (item: StoreItem): string => {
    return item._id || item.id || '';
};

/**
 * Calculate store item card state
 */
export const getStoreItemCardState = (
    item: StoreItem,
    userPoints: number
): StoreItemCardState => {
    const canAfford = userPoints >= item.cost;
    const hasStock = (item.isInfinite ?? item.isUnlimited) || (item.stock !== undefined && item.stock > 0);
    const isAvailable = hasStock;

    return {
        canAfford,
        hasStock,
        isAvailable,
    };
};

/**
 * Get button label based on state
 */
export const getRedeemButtonLabel = (
    state: StoreItemCardState
): string => {
    if (!state.hasStock) return 'Out of Stock';
    if (!state.canAfford) return 'Need Points';
    return 'Redeem';
};

/**
 * Get button color based on state
 */
export const getRedeemButtonColor = (
    state: StoreItemCardState,
    themeColors: { primary: string; disabled: string; error: string }
): string => {
    if (!state.hasStock) return themeColors.disabled;
    if (!state.canAfford) return themeColors.disabled;
    return themeColors.primary;
};
