// =========================================================
// silkpanda/momentum/app/components/store/PurchaseItemModal.tsx
// Modal for purchasing a store item (Phase 3.4)
// REFACTORED (v4) to call Embedded Web BFF
// =========================================================
'use client';

import React, { useState } from 'react';
import { Loader, X, AlertTriangle, ShoppingCart, Check } from 'lucide-react';
import { useSession, UserData } from '../layout/SessionContext';
import { IStoreItem } from '../../types';

interface PurchaseItemModalProps {
    item: IStoreItem;
    user: UserData; // The logged-in user
    currentUserPoints: number; // The user's current point total
    onClose: () => void;
    onItemPurchased: () => void;
}

const PurchaseItemModal: React.FC<PurchaseItemModalProps> = ({
    item, user, currentUserPoints, onClose, onItemPurchased
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const handlePurchase = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // REFACTORED (v4): Call the Embedded BFF endpoint
            const response = await fetch(`/web-bff/store/${item._id}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ memberId: user._id }), // Pass the logged-in user's ID
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to purchase item.');
            }

            onItemPurchased();
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const remainingPoints = currentUserPoints - item.cost;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center">
                    <div className="p-3 bg-action-primary/10 rounded-full">
                        <ShoppingCart className="w-8 h-8 text-action-primary" />
                    </div>
                </div>

                <h3 className="text-xl font-medium text-text-primary text-center mt-4">
                    Confirm Purchase
                </h3>
                <p className="text-sm text-text-secondary text-center mt-2">
                    Purchase <strong className="text-text-primary">"{item.itemName}"</strong> for
                    <strong className="text-signal-success"> {item.cost} points</strong>?
                </p>

                {/* Point Calculation */}
                <div className="text-center text-sm text-text-secondary mt-4 p-3 bg-bg-canvas rounded-lg border border-border-subtle">
                    You have {currentUserPoints} points.
                    <br />
                    You will have <strong className="text-text-primary">{remainingPoints}</strong> points remaining.
                </div>

                {/* Error Display */}
                {error && (
                    <div className="flex items-center text-sm text-signal-alert mt-4 p-3 bg-signal-alert/10 rounded-md border border-signal-alert/20">
                        <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                       text-text-secondary bg-border-subtle hover:bg-border-subtle/80"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handlePurchase}
                        disabled={isLoading}
                        className={`w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-action-primary/60' : 'bg-action-primary hover:bg-action-hover'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                        Confirm Purchase
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseItemModal;