export interface StoreItem {
    _id?: string;
    id?: string;
    itemName: string;
    description?: string;
    cost: number;
    stock?: number;
    imageUrl?: string;
    isUnlimited?: boolean;
    isInfinite?: boolean;
}

export interface StoreItemCardProps {
    item: StoreItem;
    userPoints: number;
    onPress?: () => void;
    onRedeem?: () => void;
    showActions?: boolean;
}

export interface StoreItemCardState {
    canAfford: boolean;
    hasStock: boolean;
    isAvailable: boolean;
}
