// =========================================================
// silkpanda/momentum/app/components/tasks/TaskList.tsx
// REFACTORED for Unified Task Assignment Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader, AlertTriangle, CheckSquare, UserCheck, Clock } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import { useSession } from '../layout/SessionContext';
import EditTaskModal from './EditTaskModal';
import DeleteTaskModal from './DeleteTaskModal';
import { IHouseholdMemberProfile } from '../../types';
import Collapsible from '../layout/CollapsibleSection';
import TaskCard from '../shared/TaskCard';
import { type Task } from 'momentum-shared';
import { ITask } from '../../types';

// --- Main Task List Component ---
const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [householdMembers, setHouseholdMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ITask | null>(null);

    const { token, householdId } = useSession();

    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            const response = await fetch('/web-bff/tasks/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch task page data from BFF.');
            }

            const data = await response.json();

            if (data.tasks && data.householdMembers) {
                setTasks(data.tasks);
                setHouseholdMembers(data.householdMembers);
            } else {
                throw new Error('BFF returned malformed data.');
            }

            setError(null);

        } catch (e: any) {
            setError(`Failed to load tasks or members for assignment: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApproveTask = async (task: Task) => {
        if (!token) return;
        const taskId = task._id || task.id;
        if (!taskId) {
            setError('Task ID missing');
            return;
        }
        try {
            const response = await fetch(`/web-bff/tasks/${taskId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to approve task');
            }

            // Refresh data
            fetchData();
        } catch (e: any) {
            setError(`Failed to approve task: ${e.message}`);
        }
    };

    const handleTaskCreated = (newTasks: ITask[]) => {
        fetchData();
    };

    const handleTaskUpdated = (updatedTask: ITask) => {
        fetchData();
    };

    const handleTaskDeleted = () => {
        setTasks(current => current.filter(t => t._id !== selectedTask?._id));
    };

    const openEditModal = (task: ITask) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (task: ITask) => {
        setSelectedTask(task);
        setIsDeleteModalOpen(true);
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading tasks...</p>
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

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Configured
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Task
                </button>
            </div>

            {(() => {
                const pendingApprovalTasks = tasks.filter(t => t.status === 'PendingApproval');
                const completedTasks = tasks.filter(t => t.status === 'Approved');
                const incompleteTasks = tasks.filter(t => t.status === 'Pending');

                const assignedIncompleteTasks = incompleteTasks.filter(
                    t => t.assignedTo && t.assignedTo.length > 0
                );

                return (
                    tasks.length > 0 ? (
                        <div className="space-y-4">
                            {pendingApprovalTasks.length > 0 && (
                                <Collapsible
                                    Icon={Clock}
                                    title="Pending Approval"
                                    count={pendingApprovalTasks.length}
                                    defaultOpen={true}
                                    emptyMessage="No tasks pending approval."
                                >
                                    {pendingApprovalTasks.map((task) => (
                                        <TaskCard
                                            key={task._id}
                                            task={task as any}
                                            onEdit={() => openEditModal(task)}
                                            onDelete={() => openDeleteModal(task)}
                                            onApprove={handleApproveTask}
                                        />
                                    ))}
                                </Collapsible>
                            )}

                            <Collapsible
                                Icon={UserCheck}
                                title="Assigned (Incomplete)"
                                count={assignedIncompleteTasks.length}
                                defaultOpen={true}
                                emptyMessage="No assigned (incomplete) tasks."
                            >
                                {assignedIncompleteTasks.map((task) => (
                                    <TaskCard
                                        key={task._id}
                                        task={task as any}
                                        onEdit={() => openEditModal(task)}
                                        onDelete={() => openDeleteModal(task)}
                                    />
                                ))}
                            </Collapsible>

                            <Collapsible
                                Icon={CheckSquare}
                                title="Complete"
                                count={completedTasks.length}
                                emptyMessage="No completed tasks."
                            >
                                {completedTasks.map((task) => (
                                    <TaskCard
                                        key={task._id}
                                        task={task as any}
                                        onEdit={() => openEditModal(task)}
                                        onDelete={() => openDeleteModal(task)}
                                    />
                                ))}
                            </Collapsible>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                            <p className="text-text-secondary">No tasks found. Click "Add New Task" to get started.</p>
                        </div>
                    )
                );
            })()}

            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={handleTaskCreated}
                    householdMembers={householdMembers}
                />
            )}

            {isEditModalOpen && selectedTask && (
                <EditTaskModal
                    task={selectedTask}
                    onClose={() => setIsEditModalOpen(false)}
                    onTaskUpdated={handleTaskUpdated}
                    householdMembers={householdMembers}
                />
            )}

            {isDeleteModalOpen && selectedTask && (
                <DeleteTaskModal
                    task={selectedTask}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onTaskDeleted={handleTaskDeleted}
                />
            )}
        </div>
    );
};

export default TaskList;