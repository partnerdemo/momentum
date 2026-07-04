'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Package, DollarSign, Edit2, Trash2 } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import CreateStoreItemModal from '../store/CreateStoreItemModal';
import EditStoreItemModal from '../store/EditStoreItemModal';
import { IStoreItem } from '../../types';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface StoreManagerModalProps {
    onClose: () => void;
}

type FilterType = 'all' | 'in_stock' | 'out_of_stock';

const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'in_stock', label: 'In Stock' },
    { id: 'out_of_stock', label: 'Out of Stock' },
];

const StoreManagerModal: React.FC<StoreManagerModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { storeItems, refresh } = useFamilyData();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingItem, setEditingItem] = useState<IStoreItem | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Modal States
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Filter and search items
    const filteredItems = useMemo(() => {
        return storeItems
            .filter((item) => {
                // Apply status filter
                if (activeFilter === 'in_stock') return item.isInfinite || (item.stock || 0) > 0;
                if (activeFilter === 'out_of_stock') return !item.isInfinite && (item.stock || 0) <= 0;
                return true;
            })
            .filter((item) => {
                // Apply search
                if (!searchQuery) return true;
                return item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => a.itemName.localeCompare(b.itemName));
    }, [storeItems, activeFilter, searchQuery]);

    const handleDeleteItem = async () => {
        if (!confirmDeleteId) return;

        try {
            const response = await fetch(`/web-bff/store/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete item');
            }

            await refresh();
            setConfirmDeleteId(null);
            showAlert('Success', 'Item deleted successfully', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('Error', 'Failed to delete item', 'error');
        }
    };

    const renderStoreItem = (item: IStoreItem) => {
        const isOutOfStock = !item.isInfinite && (item.stock || 0) <= 0;

        return (
            <div
                key={item._id}
                className={`bg-bg-surface border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow ${isOutOfStock ? 'opacity-70' : ''
                    }`}
            >
                {/* Image Placeholder */}
                <div className="h-32 bg-bg-canvas flex items-center justify-center relative">
                    {item.image ? (
                        <img src={item.image} alt={item.itemName} className="w-full h-full object-cover" />
                    ) : (
                        <Package className="w-12 h-12 text-text-secondary" />
                    )}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xs font-bold px-2 py-1 bg-black/40 rounded">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h4 className="text-text-primary font-semibold mb-2 truncate">
                        {item.itemName}
                    </h4>

                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1 text-action-primary">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-bold">{item.cost}</span>
                        </div>
                        <span className="text-sm text-text-secondary">
                            {item.isInfinite ? '∞' : `${item.stock} left`}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                setEditingItem(item);
                                setShowEditModal(true);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-action-primary/10 text-action-primary rounded-lg hover:bg-action-primary/20 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Edit</span>
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(item._id)}
                            className="flex items-center justify-center py-2 px-3 bg-signal-alert/10 text-signal-alert rounded-lg hover:bg-signal-alert/20 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDeleteItem}
                title="Delete Item"
                message="Are you sure you want to delete this item? This cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            <Modal isOpen={true} onClose={onClose} title="Store Manager">
                <div className="space-y-4">
                    {/* Header Actions */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Manage reward store items
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">Add Item</span>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary focus:ring-2 focus:ring-action-primary focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-2">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filter.id
                                    ? 'bg-action-primary text-white'
                                    : 'bg-bg-canvas text-text-secondary hover:bg-border-subtle'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Items Grid */}
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                        {filteredItems.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {filteredItems.map(item => renderStoreItem(item))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Package className="w-16 h-16 text-text-secondary" />
                                <h3 className="text-lg font-semibold text-text-secondary">
                                    {searchQuery ? 'No items found' : 'No store items yet'}
                                </h3>
                                <p className="text-sm text-text-secondary text-center">
                                    Tap "Add Item" to create your first reward
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateStoreItemModal
                    onClose={() => setShowCreateModal(false)}
                    onItemCreated={async () => {
                        setShowCreateModal(false);
                        await refresh();
                    }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingItem && (
                <EditStoreItemModal
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingItem(null);
                    }}
                    onItemUpdated={async () => {
                        setShowEditModal(false);
                        setEditingItem(null);
                        await refresh();
                    }}
                    item={editingItem}
                />
            )}
        </>
    );
};

export default StoreManagerModal;
