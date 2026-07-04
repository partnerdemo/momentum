// =========================================================
// silkpanda/momentum/app/components/meals/RestaurantList.tsx
// List of restaurants
// =========================================================
'use client';

import React, { useState } from 'react';
import { Plus, Search, MapPin, Phone, Utensils, Pencil } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import CreateRestaurantModal from './CreateRestaurantModal';
import EditRestaurantModal from './EditRestaurantModal';
import { IRestaurant } from '../../types';

interface RestaurantListProps {
    restaurants: IRestaurant[];
}

const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants: initialRestaurants }) => {
    const { user } = useSession();
    const [restaurants, setRestaurants] = useState<IRestaurant[]>(initialRestaurants);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<IRestaurant | null>(null);

    const handleRestaurantCreated = (newRestaurant: IRestaurant) => {
        setRestaurants([newRestaurant, ...restaurants]);
    };

    const handleRestaurantUpdated = (updatedRestaurant: IRestaurant) => {
        setRestaurants(restaurants.map(r => r._id === updatedRestaurant._id ? updatedRestaurant : r));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-text-primary">Restaurants</h2>
                {user?.role === 'Parent' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-3 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Restaurant
                    </button>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateRestaurantModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onRestaurantCreated={handleRestaurantCreated}
                />
            )}

            {editingRestaurant && (
                <EditRestaurantModal
                    restaurant={editingRestaurant}
                    onClose={() => setEditingRestaurant(null)}
                    onRestaurantUpdated={handleRestaurantUpdated}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.length > 0 ? (
                    restaurants.map((restaurant) => (
                        <div key={restaurant._id} className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-5 hover:shadow-md transition-shadow relative group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-lg bg-brand-secondary/10 text-brand-secondary">
                                    <Utensils className="w-5 h-5" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    {restaurant.priceRange && (
                                        <span className="text-xs font-medium text-text-secondary bg-bg-canvas px-2 py-1 rounded-full">
                                            {restaurant.priceRange}
                                        </span>
                                    )}
                                    {user?.role === 'Parent' && (
                                        <button
                                            onClick={() => setEditingRestaurant(restaurant)}
                                            className="p-1.5 text-text-tertiary hover:text-brand-secondary hover:bg-brand-secondary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Edit Restaurant"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h3 className="font-medium text-text-primary mb-1">{restaurant.name}</h3>
                            {restaurant.cuisine && <p className="text-sm text-text-secondary mb-3">{restaurant.cuisine}</p>}

                            <div className="space-y-1 text-xs text-text-tertiary">
                                {restaurant.address && (
                                    <div className="flex items-center">
                                        <MapPin className="w-3 h-3 mr-1.5" />
                                        <span className="truncate">{restaurant.address}</span>
                                    </div>
                                )}
                                {restaurant.phone && (
                                    <div className="flex items-center">
                                        <Phone className="w-3 h-3 mr-1.5" />
                                        <span>{restaurant.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-surface rounded-xl border border-border-subtle border-dashed">
                        <div className="mx-auto w-12 h-12 bg-bg-canvas rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">No restaurants saved</h3>
                        <p className="text-text-secondary">Save your favorite takeout spots.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantList;
