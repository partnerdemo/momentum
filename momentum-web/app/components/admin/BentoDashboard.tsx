'use client';

import React, { useState } from 'react';
import {
    ListTodo,
    ShoppingCart,
    Users,
    UtensilsCrossed,
    CheckCircle,
    Settings,
    Calendar,
    Clock,
    Wallet,
    Trophy,
    Plus
} from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import AddMemberModal from '../members/AddMemberModal';
import CreateTaskModal from '../tasks/CreateTaskModal';
import ApprovalsModal from './ApprovalsModal';
import StoreManagerModal from './StoreManagerModal';
import TaskManagerModal from './TaskManagerModal';
import MemberManagerModal from './MemberManagerModal';
import RoutineManagerModal from './RoutineManagerModal';
import SettingsModal from './SettingsModal';
import QuestManagerModal from './QuestManagerModal';
import CalendarModal from '../calendar/CalendarModal';
import MealPlannerModal from '../meals/MealPlannerModal';

const BentoDashboard: React.FC = () => {
    const { user, householdId } = useSession();
    const { members, tasks, storeItems, loading, addTask } = useFamilyData();

    // Modal states
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const [isTaskManagerModalOpen, setIsTaskManagerModalOpen] = useState(false);
    const [isMemberManagerModalOpen, setIsMemberManagerModalOpen] = useState(false);
    const [isRoutineManagerModalOpen, setIsRoutineManagerModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isQuestManagerModalOpen, setIsQuestManagerModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [isMealPlannerModalOpen, setIsMealPlannerModalOpen] = useState(false);

    // Calculate stats from real data
    const pendingApprovals = tasks.filter(t => t.status === 'PendingApproval').length;
    const activeTasks = tasks.filter(t => !t.isCompleted).length;
    const totalPoints = members.reduce((sum, m) => sum + (m.pointsTotal || 0), 0);

    const handleWidgetClick = (action: string) => {
        switch (action) {
            case 'tasks':
                setIsTaskManagerModalOpen(true);
                break;
            case 'members':
                setIsMemberManagerModalOpen(true);
                break;
            case 'approvals':
                setIsApprovalsModalOpen(true);
                break;
            case 'store':
                setIsStoreModalOpen(true);
                break;
            case 'routines':
                setIsRoutineManagerModalOpen(true);
                break;
            case 'calendar':
                setIsCalendarModalOpen(true);
                break;
            case 'meals':
                setIsMealPlannerModalOpen(true);
                break;
            case 'quests':
                setIsQuestManagerModalOpen(true);
                break;
            case 'settings':
                setIsSettingsModalOpen(true);
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">
                        Good Afternoon, {user?.firstName || 'Parent'}
                    </h1>
                    <p className="text-text-secondary mt-2">
                        Here's what's happening in your household today.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Row 1 */}
                    <DashboardWidget
                        title="Approvals"
                        value={pendingApprovals}
                        subtext="Pending requests"
                        icon={CheckCircle}
                        onClick={() => handleWidgetClick('approvals')}
                        color="text-signal-alert"
                    />

                    <DashboardWidget
                        title="The Bank"
                        value={totalPoints}
                        subtext="Total household points"
                        icon={Wallet}
                        onClick={() => handleWidgetClick('store')}
                        color="text-signal-success"
                    />

                    <DashboardWidget
                        title="Routines"
                        value={0}
                        subtext="Active routines"
                        icon={Clock}
                        onClick={() => handleWidgetClick('routines')}
                        color="text-action-primary"
                    />

                    <DashboardWidget
                        title="Members"
                        value={members.length}
                        subtext="Manage profiles"
                        icon={Users}
                        onClick={() => handleWidgetClick('members')}
                        color="text-indigo-500"
                    />

                    {/* Row 2 - Wide Calendar */}
                    <DashboardWidget
                        title="Family Calendar"
                        subtext="View and manage the family schedule"
                        icon={Calendar}
                        onClick={() => handleWidgetClick('calendar')}
                        color="text-purple-600"
                        className="col-span-1 md:col-span-2 lg:col-span-2"
                        value="View Schedule"
                    />

                    {/* Task Master */}
                    <DashboardWidget
                        title="Task Master"
                        value={activeTasks}
                        subtext="Active tasks"
                        icon={ListTodo}
                        onClick={() => handleWidgetClick('tasks')}
                        color="text-blue-500"
                        className="col-span-1 md:col-span-2 lg:col-span-2"
                    />

                    {/* Row 3 */}
                    <DashboardWidget
                        title="Meal Planner"
                        subtext="Plan this week's meals"
                        icon={UtensilsCrossed}
                        onClick={() => handleWidgetClick('meals')}
                        color="text-orange-500"
                    />

                    <DashboardWidget
                        title="Reward Store"
                        subtext="Manage items & prices"
                        icon={ShoppingCart}
                        onClick={() => handleWidgetClick('store')}
                        color="text-pink-500"
                    />

                    <DashboardWidget
                        title="Quests"
                        subtext="Manage adventures"
                        icon={Trophy}
                        onClick={() => handleWidgetClick('quests')}
                        color="text-yellow-500"
                    />

                    <DashboardWidget
                        title="Settings"
                        subtext="App configuration"
                        icon={Settings}
                        onClick={() => handleWidgetClick('settings')}
                        color="text-gray-500"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-action-primary text-white rounded-lg font-medium hover:bg-action-hover shadow-lg hover:shadow-xl transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Task</span>
                    </button>
                    <button
                        onClick={() => setIsMemberModalOpen(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Member</span>
                    </button>
                </div>
            </div>

            {/* Modals */}
            {isTaskModalOpen && (
                <CreateTaskModal
                    householdMembers={members}
                    onClose={() => setIsTaskModalOpen(false)}
                    onTaskCreated={(newTasks) => {
                        newTasks.forEach(task => addTask(task));
                        setIsTaskModalOpen(false);
                    }}
                />
            )}

            {isApprovalsModalOpen && (
                <ApprovalsModal
                    onClose={() => setIsApprovalsModalOpen(false)}
                />
            )}

            {isStoreModalOpen && (
                <StoreManagerModal
                    onClose={() => setIsStoreModalOpen(false)}
                />
            )}

            {isTaskManagerModalOpen && (
                <TaskManagerModal
                    onClose={() => setIsTaskManagerModalOpen(false)}
                />
            )}

            {isMemberManagerModalOpen && (
                <MemberManagerModal
                    onClose={() => setIsMemberManagerModalOpen(false)}
                />
            )}

            {isRoutineManagerModalOpen && (
                <RoutineManagerModal
                    onClose={() => setIsRoutineManagerModalOpen(false)}
                />
            )}

            {isSettingsModalOpen && (
                <SettingsModal
                    onClose={() => setIsSettingsModalOpen(false)}
                />
            )}

            {isQuestManagerModalOpen && (
                <QuestManagerModal
                    onClose={() => setIsQuestManagerModalOpen(false)}
                />
            )}

            {isCalendarModalOpen && (
                <CalendarModal
                    onClose={() => setIsCalendarModalOpen(false)}
                />
            )}

            {isMealPlannerModalOpen && (
                <MealPlannerModal
                    onClose={() => setIsMealPlannerModalOpen(false)}
                />
            )}

            {isMemberModalOpen && householdId && (
                <AddMemberModal
                    householdId={householdId}
                    usedColors={members.map(m => m.profileColor).filter((c): c is string => c !== undefined)}
                    onClose={() => setIsMemberModalOpen(false)}
                    onMemberAdded={() => {
                        setIsMemberModalOpen(false);
                        // Data will refresh via WebSocket
                    }}
                />
            )}
        </>
    );
};

export default BentoDashboard;
