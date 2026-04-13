// =========================================================
// silkpanda/momentum/app/components/store/StoreItemList.tsx
// Renders the list of store items and handles CRUD.
// REFACTORED (v4) to call Embedded Web BFF
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertTriangle, Plus, ShoppingCart } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { useSocket } from '../../../lib/hooks/useSocket';
import CreateStoreItemModal from './CreateStoreItemModal';
import EditStoreItemModal from './EditStoreItemModal';
import DeleteStoreItemModal from './DeleteStoreItemModal';
import PurchaseItemModal from './PurchaseItemModal';
import { IHouseholdMemberProfile } from '../../types';
import StoreItemCard from '../shared/StoreItemCard';
import { IStoreItem } from '../../types';

// --- Main Store Item List Component ---
const StoreItemList: React.FC = () => {
    const [items, setItems] = useState<IStoreItem[]>([]);
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IStoreItem | null>(null);

    const { token, user } = useSession();
    const socket = useSocket();

    const fetchData = useCallback(async () => {
        if (!token) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/web-bff/store/page-data`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch store page data from BFF.');
            }

            const data = await response.json();

            if (data.storeItems && data.memberProfiles) {
                setItems(data.storeItems);
                setMembers(data.memberProfiles);
                setError(null);
            } else {
                throw new Error('BFF returned malformed data.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // WebSocket Listener
    useEffect(() => {
        if (!socket) return;

        const handleStoreUpdate = (data: { type: string; storeItem?: IStoreItem; storeItemId?: string }) => {
            console.log('[StoreItemList] WebSocket update received:', data);

            if (data.type === 'create' && data.storeItem) {
                setItems(current => {
                    // Avoid duplicates
                    if (current.some(i => i._id === data.storeItem!._id)) return current;
                    return [...current, data.storeItem!];
                });
            } else if (data.type === 'update' && data.storeItem) {
                setItems(current =>
                    current.map(item => item._id === data.storeItem!._id ? data.storeItem! : item)
                );
            } else if (data.type === 'delete' && data.storeItemId) {
                setItems(current =>
                    current.filter(item => item._id !== data.storeItemId)
                );
            }
        };

        socket.on('store_item_updated', handleStoreUpdate);
        return () => {
            socket.off('store_item_updated', handleStoreUpdate);
        };
    }, [socket]);

    const handleItemCreated = (newItem: IStoreItem) => {
        setItems(current => [...current, newItem]);
    };

    const handleItemUpdated = (updatedItem: IStoreItem) => {
        setItems(current => current.map(item => item._id === updatedItem._id ? updatedItem : item));
    };

    const handleItemDeleted = () => {
        setItems(current => current.filter(item => item._id !== selectedItem?._id));
    };

    const handleItemPurchased = () => {
        fetchData();
    };

    const openEditModal = (item: IStoreItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (item: IStoreItem) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const openPurchaseModal = (item: IStoreItem) => {
        setSelectedItem(item);
        setIsPurchaseModalOpen(true);
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading items...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    // Find the current user's points total
    const currentUserProfile = members.find(m => m.familyMemberId._id === user?._id);
    const currentUserPoints = currentUserProfile?.pointsTotal ?? 0;

    return (
        <div className="w-full">
            {/* Header and "Add Item" Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'} in Store
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Item
                </button>
            </div>

            {/* Render Item List */}
            {items.length > 0 ? (
                <ul className="space-y-4">
                    {items.map((item) => (
                        <li key={item._id}>
                            <StoreItemCard
                                item={item}
                                userPoints={currentUserPoints}
                                onEdit={() => openEditModal(item)}
                                onDelete={() => openDeleteModal(item)}
                                onPurchase={() => openPurchaseModal(item)}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                    <ShoppingCart className="w-12 h-12 mx-auto text-text-secondary/50" />
                    <p className="mt-4 text-text-secondary">No items found in your store.</p>
                    <p className="text-sm text-text-secondary/80">Click "Add New Item" to create rewards.</p>
                </div>
            )}

            {/* Conditionally render the modals */}
            {isCreateModalOpen && (
                <CreateStoreItemModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onItemCreated={handleItemCreated}
                />
            )}

            {isEditModalOpen && selectedItem && (
                <EditStoreItemModal
                    item={selectedItem}
                    onClose={() => setIsEditModalOpen(false)}
                    onItemUpdated={handleItemUpdated}
                />
            )}

            {isDeleteModalOpen && selectedItem && (
                <DeleteStoreItemModal
                    item={selectedItem}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onItemDeleted={handleItemDeleted}
                />
            )}

            {isPurchaseModalOpen && selectedItem && user && (
                <PurchaseItemModal
                    item={selectedItem}
                    user={user}
                    currentUserPoints={currentUserPoints}
                    onClose={() => setIsPurchaseModalOpen(false)}
                    onItemPurchased={handleItemPurchased}
                />
            )}
        </div>
    );
};

export default StoreItemList;