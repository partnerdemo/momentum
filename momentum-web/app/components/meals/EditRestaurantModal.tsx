// =========================================================
// silkpanda/momentum/app/components/meals/EditRestaurantModal.tsx
// Modal for editing an existing restaurant
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Utensils, MapPin, Phone, DollarSign, Loader, AlertTriangle, Check } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IRestaurant } from '../../types';

interface EditRestaurantModalProps {
    restaurant: IRestaurant;
    onClose: () => void;
    onRestaurantUpdated: (restaurant: IRestaurant) => void;
}

const EditRestaurantModal: React.FC<EditRestaurantModalProps> = ({ restaurant, onClose, onRestaurantUpdated }) => {
    const { token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: restaurant.name,
        cuisine: restaurant.cuisine || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        website: restaurant.website || '',
        priceRange: restaurant.priceRange || '$'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setError('Restaurant name is required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/web-bff/meals/restaurants/${restaurant._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update restaurant');
            }

            onRestaurantUpdated(data.data.restaurant);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-md p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                    <Utensils className="w-6 h-6 mr-2 text-action-primary" />
                    Edit Restaurant
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Pizza Palace"
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Cuisine */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Cuisine</label>
                        <input
                            type="text"
                            name="cuisine"
                            value={formData.cuisine}
                            onChange={handleChange}
                            placeholder="e.g., Italian"
                            className="w-full p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                        />
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Price Range</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                            <select
                                name="priceRange"
                                value={formData.priceRange}
                                onChange={handleChange}
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            >
                                <option value="$">$ (Cheap)</option>
                                <option value="$$">$$ (Moderate)</option>
                                <option value="$$$">$$$ (Expensive)</option>
                                <option value="$$$$">$$$$ (Luxury)</option>
                            </select>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Main St"
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(555) 123-4567"
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                            ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-primary/90 shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Save Changes</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditRestaurantModal;
