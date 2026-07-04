// =========================================================
// silkpanda/momentum/app/components/store/EditStoreItemModal.tsx
// Modal for editing a store item (Phase 3.4)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Modified onItemUpdated to return
// the updated item object for optimistic state updates.
// =========================================================
'use client';

import React, { useState } from 'react';
import { Gift, Check, Loader, Type, X, AlertTriangle, DollarSign } from 'lucide-react';
import { IStoreItem } from '../../types';
import { useSession } from '../layout/SessionContext';

interface EditStoreItemModalProps {
    item: IStoreItem;
    onClose: () => void;
    onItemUpdated: (updatedItem: IStoreItem) => void; // TELA CODICIS: Pass back updated item
}

const EditStoreItemModal: React.FC<EditStoreItemModalProps> = ({ item, onClose, onItemUpdated }) => {
    const [itemName, setItemName] = useState(item.itemName);
    const [description, setDescription] = useState(item.description);
    const [cost, setCost] = useState(item.cost);
    const [isAvailable, setIsAvailable] = useState(item.isAvailable ?? true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (itemName.trim() === '') {
            setError('Item Name is required.');
            return;
        }
        if (cost < 1) { // FIX: Use 'cost' in validation
            setError('Cost must be at least 1 point.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // REFACTORED (v4): Call the Embedded BFF endpoint
            const response = await fetch(`/web-bff/store/${item._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    itemName,
                    description,
                    cost,
                    isAvailable,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update item.');
            }

            onItemUpdated(data.data.storeItem); // TELA CODICIS: Pass the updated item object back
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle"
                >
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <h3 className="text-xl font-medium text-text-primary">Edit Store Item</h3>

                    {/* Item Name Input */}
                    <div className="space-y-1">
                        <label htmlFor="itemName" className="block text-sm font-medium text-text-secondary">
                            Item Name (Mandatory)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Gift className="h-5 w-5 text-text-secondary" />
                            </div>
                            <input
                                id="itemName"
                                name="itemName"
                                type="text"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                            />
                        </div>
                    </div>

                    {/* Cost Input */}
                    <div className="space-y-1">
                        <label htmlFor="cost" className="block text-sm font-medium text-text-secondary">
                            Cost (in Points)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <DollarSign className="h-5 w-5 text-text-secondary" />
                            </div>
                            <input
                                id="cost"
                                name="cost"
                                type="number"
                                min="1"
                                value={cost}
                                onChange={(e) => setCost(parseInt(e.target.value, 10) || 1)} // FIX: Use setCost
                                className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                            />
                        </div>
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="block w-full rounded-md border border-border-subtle p-3 text-text-primary bg-bg-surface"
                        />
                    </div>

                    {/* Is Available Checkbox */}
                    <div className="flex items-center space-x-3">
                        <input
                            id="isAvailable"
                            type="checkbox"
                            checked={isAvailable}
                            onChange={(e) => setIsAvailable(e.target.checked)}
                            className="h-5 w-5 rounded border-border-subtle text-action-primary focus:ring-action-primary"
                        />
                        <label htmlFor="isAvailable" className="text-sm font-medium text-text-primary">
                            Available in Store
                        </label>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center text-sm text-signal-alert">
                            <AlertTriangle className="w-4 h-4 mr-1.5" /> {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-action-primary/60' : 'bg-action-primary hover:bg-action-hover'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditStoreItemModal;