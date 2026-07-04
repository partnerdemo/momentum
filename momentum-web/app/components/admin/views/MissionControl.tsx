import React, { useState } from 'react';
import {
    Users,
    ShoppingCart,
    ListTodo,
    CheckCircle,
    Inbox,
    Menu,
    Settings,
    Shield,
    AlertTriangle,
    Check,
    Calendar,
    Utensils,
    Clock
} from 'lucide-react';
import { useSession } from '../../../components/layout/SessionContext';
import { useFamilyData } from '../../../../lib/hooks/useFamilyData';

// Modals (Reused from Dashboard)
import CreateTaskModal from '../../tasks/CreateTaskModal';
import ApprovalsModal from '../ApprovalsModal';
import StoreManagerModal from '../StoreManagerModal';
import TaskManagerModal from '../TaskManagerModal';
import MemberManagerModal from '../MemberManagerModal';
import RoutineManagerModal from '../RoutineManagerModal';
import SettingsModal from '../SettingsModal';
import QuestManagerModal from '../QuestManagerModal';

// --- Control Module Component ---
const ControlModule = ({
    title,
    icon: Icon,
    onClick,
    badge,
    accent = 'text-indigo-500',
    bgAccent = 'bg-indigo-50',
    description
}: {
    title: string;
    icon: React.ElementType;
    onClick: () => void;
    badge?: number;
    accent?: string;
    bgAccent?: string;
    description?: string;
}) => (
    <button
        onClick={onClick}
        className="relative group flex flex-col items-start p-6 bg-bg-surface rounded-2xl border border-border-subtle shadow-sm hover:shadow-md transition-all h-full w-full text-left"
    >
        <div className={`p-4 rounded-xl ${bgAccent} ${accent} mb-4 group-hover:scale-110 transition-transform`}>
            <Icon className="w-8 h-8" />
        </div>

        {badge !== undefined && badge > 0 && (
            <div className="absolute top-6 right-6 px-3 py-1 bg-signal-alert text-white text-xs font-bold rounded-full animate-bounce">
                {badge}
            </div>
        )}

        <h3 className="text-xl font-bold text-text-primary mb-1">{title}</h3>
        {description && (
            <p className="text-sm text-text-secondary">{description}</p>
        )}
    </button>
);

export default function MissionControl() {
    const { user } = useSession();
    const { tasks, members } = useFamilyData();

    // Stats
    const pendingApprovals = tasks.filter(t => t.status === 'PendingApproval');
    const systemStatus = pendingApprovals.length > 0 ? 'attention' : 'operational';

    // Modal States
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const closeModal = () => setActiveModal(null);

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">

            {/* --- System Status Header --- */}
            <div className={`mb-12 p-6 rounded-2xl border ${systemStatus === 'attention'
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30'
                    : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${systemStatus === 'attention' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${systemStatus === 'attention' ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'
                                }`}>
                                {systemStatus === 'attention' ? 'System Attention Needed' : 'All Systems Operational'}
                            </h2>
                            <p className="text-text-secondary">
                                {systemStatus === 'attention'
                                    ? `${pendingApprovals.length} item(s) require administrative review.`
                                    : 'Household is running at optimal efficiency.'}
                            </p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-mono text-sm font-bold tracking-wider uppercase ${systemStatus === 'attention'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        {systemStatus === 'attention' ? 'ALERT LEVEL 2' : 'STATUS: NOMINAL'}
                    </div>
                </div>
            </div>

            {/* --- Control Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ControlModule
                    title="Inbox"
                    description="Review pending approvals"
                    icon={Inbox}
                    badge={pendingApprovals.length}
                    accent="text-indigo-600"
                    bgAccent="bg-indigo-100 dark:bg-indigo-900/30"
                    onClick={() => setActiveModal('approvals')}
                />

                <ControlModule
                    title="Task Ops"
                    description="Assign & manage duties"
                    icon={ListTodo}
                    accent="text-blue-600"
                    bgAccent="bg-blue-100 dark:bg-blue-900/30"
                    onClick={() => setActiveModal('tasks')}
                />

                <ControlModule
                    title="Crew Roster"
                    description={`Manage ${members.length} members`}
                    icon={Users}
                    accent="text-purple-600"
                    bgAccent="bg-purple-100 dark:bg-purple-900/30"
                    onClick={() => setActiveModal('members')}
                />

                <ControlModule
                    title="Supply Depot"
                    description="Store & rewards inventory"
                    icon={ShoppingCart}
                    accent="text-emerald-600"
                    bgAccent="bg-emerald-100 dark:bg-emerald-900/30"
                    onClick={() => setActiveModal('store')}
                />

                <ControlModule
                    title="Protocols"
                    description="Daily routines & schedules"
                    icon={Clock}
                    accent="text-orange-600"
                    bgAccent="bg-orange-100 dark:bg-orange-900/30"
                    onClick={() => setActiveModal('routines')}
                />

                <ControlModule
                    title="System Config"
                    description="App settings & preferences"
                    icon={Settings}
                    accent="text-slate-600"
                    bgAccent="bg-slate-100 dark:bg-slate-800"
                    onClick={() => setActiveModal('settings')}
                />
            </div>

            {/* --- Modals Integration --- */}
            {activeModal === 'approvals' && <ApprovalsModal onClose={closeModal} />}
            {activeModal === 'tasks' && <TaskManagerModal onClose={closeModal} />}
            {activeModal === 'members' && <MemberManagerModal onClose={closeModal} />}
            {activeModal === 'store' && <StoreManagerModal onClose={closeModal} />}
            {activeModal === 'routines' && <RoutineManagerModal onClose={closeModal} />}
            {activeModal === 'settings' && <SettingsModal onClose={closeModal} />}
        </div>
    );
}
