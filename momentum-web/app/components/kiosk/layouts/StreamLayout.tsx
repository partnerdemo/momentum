import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../../types';
import HorizontalTimeline from '../widgets/HorizontalTimeline';
import HorizontalRoster from '../widgets/HorizontalRoster';
import { Clock, CloudSun, Utensils } from 'lucide-react';

interface StreamLayoutProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    mealPlans: any[];
    onMemberClick: (member: IHouseholdMemberProfile) => void;
}

const StreamLayout: React.FC<StreamLayoutProps> = ({ members, tasks, mealPlans, onMemberClick }) => {
    // Get simple meal string
    const today = new Date().toISOString().split('T')[0];
    const dinner = mealPlans.flatMap(p => p.meals).find((m: any) =>
        (typeof m.date === 'string' ? m.date : m.date.toISOString()).startsWith(today) && m.mealType === 'Dinner'
    );
    const dinnerHas = dinner ? (dinner.itemId?.name || dinner.customTitle) : "Not Planned";

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Top Band (20%) - Environment */}
            <div className="h-[15%] bg-white rounded-2xl flex items-center justify-between px-8 shadow-sm border border-border-subtle">
                <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-action-primary" />
                    <span className="text-3xl font-bold text-text-primary">
                        {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-text-secondary">
                    <CloudSun className="w-8 h-8" />
                    <span className="text-xl">72°F Sunny</span>
                </div>

                <div className="flex items-center gap-3 text-text-secondary">
                    <Utensils className="w-6 h-6" />
                    <span className="text-xl font-medium truncate max-w-[200px]">{dinnerHas}</span>
                </div>
            </div>

            {/* Middle Band (55%) - Stream Timeline */}
            <div className="h-[55%]">
                <HorizontalTimeline />
            </div>

            {/* Bottom Band (30%) - Horizontal Roster */}
            <div className="h-[30%] bg-bg-canvas/50 rounded-2xl border border-border-subtle">
                <HorizontalRoster members={members} tasks={tasks} onMemberClick={onMemberClick} />
            </div>
        </div>
    );
};

export default StreamLayout;
