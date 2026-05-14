import React, { useState } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../../types';
import { Loader, AlertTriangle, Settings, Mic } from 'lucide-react';
import KioskMemberProfileModal from './KioskMemberProfileModal';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import { useSocketEvent } from '../../../lib/hooks/useSocket';
import { SOCKET_EVENTS } from '../../../lib/socket';

import KioskHeader from './KioskHeader';
import KioskDailyMenu from './KioskDailyMenu';
import KioskBottomRow from './KioskBottomRow';
import RosterGrid from './RosterGrid';

// --- Main Kiosk Dashboard Component ---
const KioskDashboard: React.FC = () => {
    const { householdId, user } = useSession();
    const { members, tasks, storeItems, mealPlans, loading, error, refresh, updateTask } = useFamilyData();

    // WebSocket Listeners for immediate updates
    useSocketEvent(SOCKET_EVENTS.TASK_UPDATED, () => refresh());
    useSocketEvent(SOCKET_EVENTS.QUEST_UPDATED, () => refresh());
    useSocketEvent(SOCKET_EVENTS.MEMBER_POINTS_UPDATED, () => refresh());

    // Modal state
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Keep selectedMember in sync with global members data (for real-time point updates)
    React.useEffect(() => {
        if (selectedMember) {
            const updatedMember = members.find(m => m._id === selectedMember._id);
            if (updatedMember && updatedMember !== selectedMember) {
                setSelectedMember(updatedMember);
            }
        }
    }, [members, selectedMember]);

    const handleMemberClick = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedMember(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading family data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center p-6 bg-red-100 text-red-600 rounded-lg border border-red-300">
                    <AlertTriangle className="w-6 h-6 mr-3" />
                    <p className="font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <KioskHeader />
            <KioskDailyMenu mealPlans={mealPlans} />
            <RosterGrid members={members} tasks={tasks} onMemberClick={handleMemberClick} />
            <KioskBottomRow />

            {/* Floating Controls (Stitch mockup) */}
            <div className="fixed bottom-12 right-12 flex flex-col gap-6 z-[60]">
                {/* 
                     These components simulate potential generic admin capabilities later down the line,
                     but keeping it inline with user mockup request
                 */}
                <button className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl text-gray-500 hover:text-blue-600 transition-all border border-gray-200 active:scale-90">
                    <Settings className="w-10 h-10" />
                </button>
                <button className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl text-white hover:scale-110 transition-all active:scale-95 shadow-blue-600/30">
                    <Mic className="w-10 h-10" />
                </button>
            </div>

            {/* Modals - Constraint respected: parent pin is solely within this view */}
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
        </>
    );
};

export default KioskDashboard;
