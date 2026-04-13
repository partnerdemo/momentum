// =========================================================
// momentum-web/app/components/kiosk/KioskDashboard.tsx
// Main Kiosk View - The "Always-On" Family Command Center
// Shows: Family Roster, Calendar, Meal Plan, Pending Tasks
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile, ITask, IStoreItem, IRecipe } from '../../types';
import { Loader, AlertTriangle, Bell, Settings, LayoutGrid, Server, Activity, ClipboardList, Columns } from 'lucide-react';
import KioskMemberProfileModal from './KioskMemberProfileModal';
import FocusModeModal from '../focus/FocusModeModal';
import PinVerificationModal from '../auth/PinVerificationModal';
import { useRouter } from 'next/navigation';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

// Layouts
import NexusLayout from './layouts/NexusLayout';
import StreamLayout from './layouts/StreamLayout';
import PulseLayout from './layouts/PulseLayout';
import CorkboardLayout from './layouts/CorkboardLayout';
import PillarsLayout from './layouts/PillarsLayout';

import AlertModal from '../shared/AlertModal';

// --- Types ---
type LayoutType = 'nexus' | 'stream' | 'pulse' | 'corkboard' | 'pillars';

const LAYOUTS: { id: LayoutType; name: string; icon: React.ElementType }[] = [
    { id: 'nexus', name: 'Nexus (Default)', icon: LayoutGrid },
    { id: 'stream', name: 'Stream (Time Blindness)', icon: Server }, // Server icon looks like horizontal lines
    { id: 'pulse', name: 'Pulse (Focus)', icon: Activity },
    { id: 'corkboard', name: 'Corkboard (Visual)', icon: ClipboardList },
    { id: 'pillars', name: 'Pillars (Parallel)', icon: Columns },
];

// --- Remind Parent FAB ---
const RemindParentButton: React.FC<{ onRemind: () => void }> = ({ onRemind }) => {
    return (
        <button
            onClick={onRemind}
            className="fixed bottom-8 right-8 bg-action-primary text-white p-4 rounded-full shadow-xl 
                       hover:bg-action-hover hover:scale-110 transition-all duration-300 z-50 flex items-center gap-2"
        >
            <Bell className="w-6 h-6" />
            <span className="font-bold pr-2">Remind Parent</span>
        </button>
    );
};

// --- Main Kiosk Dashboard Component ---
const KioskDashboard: React.FC = () => {
    const { householdId, user } = useSession();
    const { members, tasks, storeItems, mealPlans, recipes, quests, loading, error, refresh, updateTask } = useFamilyData();

    // Layout State
    const [activeLayout, setActiveLayout] = useState<LayoutType>('nexus');

    // Modal state
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

    // FIX: Keep selectedMember in sync with global members data (for real-time point updates)
    React.useEffect(() => {
        if (selectedMember) {
            const updatedMember = members.find(m => m._id === selectedMember._id);
            if (updatedMember && updatedMember !== selectedMember) {
                setSelectedMember(updatedMember);
            }
        }
    }, [members, selectedMember]);

    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, variant: 'info' | 'error' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'error' | 'success' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    // --- Parent Dashboard Navigation ---
    const router = useRouter();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [parentMemberId, setParentMemberId] = useState<string>('');

    const handleMemberClick = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleFocusClick = (e: React.MouseEvent, member: IHouseholdMemberProfile) => {
        e.stopPropagation(); // Prevent opening the profile modal
        setSelectedMember(member);
        setIsFocusModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setIsFocusModalOpen(false);
        setSelectedMember(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-action-primary animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">Loading family data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center p-6 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                    <AlertTriangle className="w-6 h-6 mr-3" />
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    const handleParentDashboardClick = () => {
        // Prioritize the current logged-in user if they are a parent
        let targetMemberId = '';

        if (user && user.role === 'Parent') {
            const currentUserProfile = members.find(m => {
                const familyMemberIdStr = typeof m.familyMemberId === 'object'
                    ? m.familyMemberId._id
                    : m.familyMemberId;
                return familyMemberIdStr === user._id;
            });

            if (currentUserProfile && currentUserProfile.role === 'Parent') {
                targetMemberId = currentUserProfile._id;
            }
        }

        if (!targetMemberId) {
            // Fallback: Pick the first parent found
            const parent = members.find(m => m.role === 'Parent');
            if (parent) {
                targetMemberId = parent._id;
            }
        }

        if (targetMemberId) {
            setParentMemberId(targetMemberId);
            setIsPinModalOpen(true);
        } else {
            showAlert('Parent Profile Not Found', 'No parent profile found to verify against.', 'error');
        }
    };

    const handlePinSuccess = () => {
        router.push('/admin');
    };

    const handleRemindParent = () => {
        showAlert('Notification Sent', 'Parent has been notified! (Simulation)', 'success');
    };

    // --- Layout Renderer ---
    const renderLayout = () => {
        const commonProps = {
            members,
            tasks,
            mealPlans,
            recipes,
            quests,
            onMemberClick: handleMemberClick,
            onFocusClick: handleFocusClick
        };

        switch (activeLayout) {
            case 'nexus':
                return <NexusLayout {...commonProps} />;
            case 'stream':
                return <StreamLayout {...commonProps} />;
            case 'pulse':
                return <PulseLayout {...commonProps} />;
            case 'corkboard':
                return <CorkboardLayout {...commonProps} />;
            case 'pillars':
                return <PillarsLayout {...commonProps} />;
            default:
                return <NexusLayout {...commonProps} />;
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] w-full relative">
            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            {/* Layout Switcher (Top Right) */}
            <div className="absolute -top-16 right-0 flex bg-bg-surface border border-border-subtle rounded-xl p-1 shadow-sm overflow-hidden z-20">
                {LAYOUTS.map((layout) => (
                    <button
                        key={layout.id}
                        onClick={() => setActiveLayout(layout.id)}
                        className={`p-2 rounded-lg transition-all ${activeLayout === layout.id
                            ? 'bg-action-primary text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-canvas'
                            }`}
                        title={layout.name}
                    >
                        <layout.icon className="w-5 h-5" />
                    </button>
                ))}
            </div>

            {/* Main Layout Area */}
            {renderLayout()}

            {/* Floating Actions */}
            <RemindParentButton onRemind={handleRemindParent} />

            <button
                onClick={handleParentDashboardClick}
                className="fixed bottom-8 left-8 p-4 bg-bg-surface border border-border-subtle rounded-full 
                           text-text-secondary hover:text-action-primary hover:border-action-primary 
                           shadow-lg hover:shadow-xl transition-all z-50"
                title="Parent Dashboard"
            >
                <Settings className="w-6 h-6" />
            </button>

            {/* Modals */}
            {isModalOpen && selectedMember && (
                <KioskMemberProfileModal
                    member={selectedMember}
                    allTasks={tasks}
                    allItems={storeItems}
                    onClose={handleModalClose}
                    onRefresh={refresh}
                    onUpdateTask={updateTask}
                />
            )}

            {isFocusModalOpen && selectedMember && (
                <FocusModeModal
                    member={selectedMember}
                    tasks={tasks}
                    onClose={handleModalClose}
                    onFocusSet={() => refresh()}
                />
            )}

            <PinVerificationModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                title="Parent Access"
                description="Enter your PIN to access the Parent Dashboard."
                memberId={parentMemberId}
                householdId={householdId || ''}
            />
        </div>
    );
};

export default KioskDashboard;
