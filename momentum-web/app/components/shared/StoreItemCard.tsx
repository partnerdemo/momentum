import React from 'react';
import { Gift, ShoppingCart, Edit, Trash } from 'lucide-react';
import {
    getStoreItemCardState,
    getRedeemButtonLabel,
    type StoreItemCardProps
} from 'momentum-shared';

// Extend props to include web-specific actions
interface WebStoreItemCardProps extends StoreItemCardProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onPurchase?: () => void; // Alias for onRedeem
}

const StoreItemCard: React.FC<WebStoreItemCardProps> = ({
    item,
    userPoints,
    onEdit,
    onDelete,
    onPurchase,
    onRedeem
}) => {
    const { canAfford, hasStock } = getStoreItemCardState(item, userPoints);
    const buttonLabel = getRedeemButtonLabel({ canAfford, hasStock, isAvailable: hasStock });

    const handlePurchase = onRedeem || onPurchase;

    return (
        <div className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
            <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                    <Gift className="w-5 h-5 text-action-primary" />
                </div>
                <div>
                    <p className="text-base font-medium text-text-primary">{item.itemName}</p>
                    <p className="text-sm text-text-secondary">{item.description || 'No description'}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-center">
                    <p className="text-lg font-semibold text-signal-success">{item.cost}</p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>

                {/* Purchase Button */}
                {handlePurchase && (
                    <button
                        onClick={handlePurchase}
                        disabled={!canAfford || !hasStock}
                        title={!hasStock ? "Out of Stock" : !canAfford ? "You do not have enough points" : "Purchase Item"}
                        className="p-2 text-text-secondary hover:text-signal-success transition-colors 
                    disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="w-4 h-4" />
                    </button>
                )}

                {/* Actions */}
                {onEdit && (
                    <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Item">
                        <Edit className="w-4 h-4" />
                    </button>
                )}

                {onDelete && (
                    <button onClick={onDelete} className="p-2 text-text-secondary hover:text-signal-alert transition-colors" title="Delete Item">
                        <Trash className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default StoreItemCard;
