// =========================================================
// silkpanda/momentum/app/components/store/CreateStoreItemModal.tsx
// Modal for creating a new store item (Phase 3.4)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Modified onItemCreated to return
// the new item object for optimistic state updates.
// =========================================================
'use client';

import React, { useState } from 'react';
import { Gift, Check, Loader, Type, X, AlertTriangle, DollarSign } from 'lucide-react';
import { IStoreItem } from '../../types';
import { useSession } from '../layout/SessionContext';
import {
    validateForm,
    getInitialFormData,
    sanitizeFormData,
    type FormField,
    type FormData
} from 'momentum-shared';

interface CreateStoreItemModalProps {
    onClose: () => void;
    onItemCreated: (newItem: IStoreItem) => void;
}

const STORE_ITEM_FORM_FIELDS: FormField[] = [
    { name: 'itemName', label: 'Item Name', type: 'text', required: true, min: 3 },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'cost', label: 'Cost (in Points)', type: 'number', required: true, min: 1, defaultValue: 100 },
];

const CreateStoreItemModal: React.FC<CreateStoreItemModalProps> = ({ onClose, onItemCreated }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form State
    const [formData, setFormData] = useState<FormData>(getInitialFormData(STORE_ITEM_FORM_FIELDS));

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validate Form Fields
        const validation = validateForm(formData, STORE_ITEM_FORM_FIELDS);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            // 2. Sanitize Data
            const sanitizedData = sanitizeFormData(formData, STORE_ITEM_FORM_FIELDS);

            const response = await fetch('/web-bff/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    itemName: sanitizedData.itemName,
                    description: sanitizedData.description,
                    cost: sanitizedData.cost,
                    isAvailable: true,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create item.');
            }

            onItemCreated(data.data.storeItem);
            onClose();

        } catch (err: any) {
            setErrors(prev => ({ ...prev, global: err.message }));
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
                    <h3 className="text-xl font-medium text-text-primary">Create New Store Item</h3>

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
                                value={formData.itemName}
                                onChange={(e) => handleChange('itemName', e.target.value)}
                                placeholder="e.g., '1 Hour of Video Games'"
                                className={`block w-full rounded-md border p-3 pl-10 text-text-primary bg-bg-surface
                                    ${errors.itemName ? 'border-signal-alert focus:ring-signal-alert' : 'border-border-subtle focus:ring-action-primary'}`}
                            />
                        </div>
                        {errors.itemName && <p className="text-xs text-signal-alert mt-1">{errors.itemName}</p>}
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
                                value={formData.cost}
                                onChange={(e) => handleChange('cost', e.target.value)}
                                className={`block w-full rounded-md border p-3 pl-10 text-text-primary bg-bg-surface
                                    ${errors.cost ? 'border-signal-alert focus:ring-signal-alert' : 'border-border-subtle focus:ring-action-primary'}`}
                            />
                        </div>
                        {errors.cost && <p className="text-xs text-signal-alert mt-1">{errors.cost}</p>}
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
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="e.g., 'Redeemable on weekdays after homework is done.'"
                            className="block w-full rounded-md border border-border-subtle p-3 text-text-primary bg-bg-surface focus:ring-action-primary"
                        />
                    </div>

                    {/* Global Error Display */}
                    {errors.global && (
                        <div className="flex items-center text-sm text-signal-alert">
                            <AlertTriangle className="w-4 h-4 mr-1.5" /> {errors.global}
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
                        Create Item
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateStoreItemModal;