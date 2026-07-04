import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../../types';
import TimelineCard from '../TimelineCard'; // Reuse Timeline!
import MemberSmartCard from '../widgets/MemberSmartCard';
import { Target, Utensils } from 'lucide-react';

interface CorkboardLayoutProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    mealPlans: any[];
    quests: any[];
    onMemberClick: (m: IHouseholdMemberProfile) => void;
}

const CorkboardLayout: React.FC<CorkboardLayoutProps> = ({ members, tasks, mealPlans, quests, onMemberClick }) => {
    const activeQuest = quests.find((q: any) => q.status === 'Active');

    // Meal logic
    const today = new Date().toISOString().split('T')[0];
    const dinner = mealPlans.flatMap(p => p.meals).find((m: any) =>
        (typeof m.date === 'string' ? m.date : m.date.toISOString()).startsWith(today) && m.mealType === 'Dinner'
    );

    return (
        <div className="h-full p-2 grid grid-cols-12 grid-rows-6 gap-6">

            {/* Top Left: Calendar (Large) - 8 cols, 4 rows */}
            <div className="col-span-8 row-span-4 rounded-xl overflow-hidden shadow-sm border border-border-subtle">
                <TimelineCard />
            </div>

            {/* Top Right: Quest (Medium) - 4 cols, 2 rows */}
            <div className="col-span-4 row-span-2 bg-white rounded-xl border border-border-subtle p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target className="w-24 h-24 text-action-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-secondary uppercase tracking-widest">Global Quest</h3>
                {activeQuest ? (
                    <div>
                        <div className="text-2xl font-bold text-text-primary mb-2 line-clamp-2">{activeQuest.title}</div>
                        <div className="w-full bg-bg-canvas h-4 rounded-full overflow-hidden">
                            {/* Mock Progress */}
                            <div className="w-[65%] h-full bg-action-primary rounded-full"></div>
                        </div>
                        <div className="text-right text-xs text-text-secondary mt-1">65% Complete</div>
                    </div>
                ) : (
                    <div className="text-xl font-bold text-text-secondary">No Active Quest</div>
                )}
            </div>

            {/* Middle Right: Meal (Medium) - 4 cols, 2 rows */}
            <div className="col-span-4 row-span-2 bg-white rounded-xl border border-border-subtle p-6 flex items-center gap-4 shadow-sm">
                <div className="w-16 h-16 bg-bg-canvas rounded-full flex items-center justify-center shrink-0">
                    <Utensils className="w-8 h-8 text-action-primary" />
                </div>
                <div>
                    <span className="text-xs font-bold uppercase text-text-secondary">On The Menu</span>
                    <h3 className="text-xl font-bold text-text-primary line-clamp-2">
                        {dinner ? (dinner.itemId?.name || dinner.customTitle) : "Chef's Choice (Undefined)"}
                    </h3>
                </div>
            </div>

            {/* Bottom Row: Member Grid - 12 cols, 2 rows */}
            <div className="col-span-12 row-span-2 bg-bg-canvas/50 rounded-xl border border-border-subtle p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {members.map(m => (
                        <MemberSmartCard
                            key={m._id}
                            member={m}
                            taskCount={tasks.filter(t => t.assignedTo?.some(a => a._id === m._id) && t.status !== 'Approved').length}
                            onClick={() => onMemberClick(m)}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default CorkboardLayout;
