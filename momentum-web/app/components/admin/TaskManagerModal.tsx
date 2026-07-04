'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Edit2, Trash2, CheckCircle, Filter } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import EditTaskModal from '../tasks/EditTaskModal';
import CreateTaskModal from '../tasks/CreateTaskModal';
import { ITask } from '../../types';
import AlertModal from '../shared/AlertModal';
import ConfirmModal from '../shared/ConfirmModal';

interface TaskManagerModalProps {
    onClose: () => void;
}

type FilterType = 'all' | 'pending' | 'approval' | 'completed';

const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Active' },
    { id: 'approval', label: 'Pending Approval' },
    { id: 'completed', label: 'Completed' },
];

const TaskManagerModal: React.FC<TaskManagerModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const { tasks, members, addTask, refresh } = useFamilyData();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [editingTask, setEditingTask] = useState<ITask | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Modal States
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmBatchDeleteOpen, setConfirmBatchDeleteOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // Filter and search tasks
    const filteredTasks = useMemo(() => {
        return tasks
            .filter((task) => {
                // Apply status filter
                if (activeFilter === 'pending') return task.status === 'Pending';
                if (activeFilter === 'approval') return task.status === 'PendingApproval';
                if (activeFilter === 'completed') return task.status === 'Approved';
                return true;
            })
            .filter((task) => {
                // Apply search
                if (!searchQuery) return true;
                return task.title.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => {
                // Sort: Pending Approval first, then Pending, then Approved
                const statusOrder: Record<string, number> = { PendingApproval: 0, Pending: 1, Approved: 2 };
                const rankA = statusOrder[a.status || ''] ?? 3;
                const rankB = statusOrder[b.status || ''] ?? 3;
                return rankA - rankB;
            });
    }, [tasks, activeFilter, searchQuery]);

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    const clearSelection = () => setSelectedTasks([]);

    const handleBatchApprove = async () => {
        if (selectedTasks.length === 0) return;

        try {
            await Promise.all(
                selectedTasks.map((id) =>
                    fetch(`/web-bff/tasks/${id}/approve`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            clearSelection();
            refresh();
            showAlert('Success', `Approved ${selectedTasks.length} task(s)!`, 'success');
        } catch (error) {
            console.error('Batch approve error:', error);
            showAlert('Error', 'Failed to approve some tasks', 'error');
        }
    };

    const handleBatchDelete = async () => {
        if (selectedTasks.length === 0) return;

        try {
            await Promise.all(
                selectedTasks.map((id) =>
                    fetch(`/web-bff/tasks/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                )
            );
            clearSelection();
            setConfirmBatchDeleteOpen(false);
            refresh();
            showAlert('Success', 'Tasks deleted successfully', 'success');
        } catch (error) {
            console.error('Batch delete error:', error);
            showAlert('Error', 'Failed to delete some tasks', 'error');
        }
    };

    const handleQuickApprove = async (taskId: string) => {
        try {
            await fetch(`/web-bff/tasks/${taskId}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            refresh();
        } catch (error) {
            console.error('Approve error:', error);
            showAlert('Error', 'Failed to approve task', 'error');
        }
    };

    const handleDeleteTask = async () => {
        if (!confirmDeleteId) return;

        try {
            await fetch(`/web-bff/tasks/${confirmDeleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConfirmDeleteId(null);
            refresh();
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('Error', 'Failed to delete task', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-signal-success';
            case 'PendingApproval':
                return 'bg-yellow-500';
            default:
                return 'bg-action-primary';
        }
    };

    const getStatusLabel = (status: string) => {
        return status === 'PendingApproval' ? 'Review' : status;
    };

    const renderTask = (task: ITask) => {
        const isSelected = selectedTasks.includes(task._id);
        const assignedMember = members.find((m) =>
            task.assignedTo?.some(a => a._id === m._id || a._id === m.familyMemberId._id)
        );

        return (
            <div
                key={task._id}
                className={`flex items-center space-x-3 py-3 border-b border-border-subtle ${isSelected ? 'bg-action-primary/10' : ''
                    }`}
            >
                {/* Checkbox */}
                <button
                    onClick={() => toggleTaskSelection(task._id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                        ? 'bg-action-primary border-action-primary'
                        : 'border-border-subtle hover:border-action-primary'
                        }`}
                >
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </button>

                {/* Task Info */}
                <button
                    onClick={() => {
                        setEditingTask(task);
                        setShowEditModal(true);
                    }}
                    className="flex-1 text-left"
                >
                    <p className="text-text-primary font-semibold">{task.title}</p>
                    <p className="text-sm text-text-secondary">
                        {assignedMember?.displayName || 'Unassigned'} • {task.pointsValue} pts
                    </p>
                </button>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-lg text-white text-xs font-semibold ${getStatusColor(task.status || '')}`}>
                    {getStatusLabel(task.status || '')}
                </span>

                {/* Quick Actions */}
                <div className="flex space-x-2">
                    {task.status === 'PendingApproval' && (
                        <button
                            onClick={() => handleQuickApprove(task._id)}
                            className="w-8 h-8 flex items-center justify-center bg-signal-success rounded-lg hover:bg-green-600 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 text-white" />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setEditingTask(task);
                            setShowEditModal(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-action-primary rounded-lg hover:bg-action-hover transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={() => setConfirmDeleteId(task._id)}
                        className="w-8 h-8 flex items-center justify-center bg-signal-alert rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-white" />
                    </button>
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
                onConfirm={handleDeleteTask}
                title="Delete Task"
                message="Are you sure you want to delete this task? This cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            <ConfirmModal
                isOpen={confirmBatchDeleteOpen}
                onClose={() => setConfirmBatchDeleteOpen(false)}
                onConfirm={handleBatchDelete}
                title="Delete Tasks"
                message={`Are you sure you want to delete ${selectedTasks.length} task(s)? This cannot be undone.`}
                confirmText="Delete All"
                variant="danger"
            />

            <Modal isOpen={true} onClose={onClose} title="Task Manager">
                <div className="space-y-4">
                    {/* Header Actions */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Manage all household tasks
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">New</span>
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
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

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeFilter === filter.id
                                    ? 'bg-action-primary text-white'
                                    : 'bg-bg-canvas text-text-primary border border-border-subtle hover:bg-border-subtle'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Batch Actions Bar */}
                    {selectedTasks.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-action-primary rounded-lg">
                            <span className="text-white font-semibold">{selectedTasks.length} selected</span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleBatchApprove}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-signal-success rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4 text-white" />
                                    <span className="text-white text-sm font-semibold">Approve</span>
                                </button>
                                <button
                                    onClick={() => setConfirmBatchDeleteOpen(true)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-signal-alert rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                    <span className="text-white text-sm font-semibold">Delete</span>
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Task List */}
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                        {filteredTasks.length > 0 ? (
                            <div>
                                {filteredTasks.map(task => renderTask(task))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Filter className="w-16 h-16 text-border-subtle" />
                                <h3 className="text-lg font-semibold text-text-primary">
                                    {searchQuery ? 'No tasks match your search' : 'No tasks found'}
                                </h3>
                                <p className="text-sm text-text-secondary text-center">
                                    {searchQuery
                                        ? 'Try adjusting your search or filters'
                                        : 'Create a new task to get started'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTaskModal
                    householdMembers={members}
                    onClose={() => setShowCreateModal(false)}
                    onTaskCreated={(newTasks) => {
                        setShowCreateModal(false);
                        newTasks.forEach(task => addTask(task));
                        refresh();
                    }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingTask && (
                <EditTaskModal
                    task={editingTask}
                    householdMembers={members}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingTask(null);
                    }}
                    onTaskUpdated={() => {
                        setShowEditModal(false);
                        setEditingTask(null);
                        refresh();
                    }}
                />
            )}
        </>
    );
};

export default TaskManagerModal;
