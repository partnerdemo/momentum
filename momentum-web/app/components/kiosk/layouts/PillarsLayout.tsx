import React from 'react';
import { IHouseholdMemberProfile } from '../../../types';
import MemberScheduleColumn from '../widgets/MemberScheduleColumn';
import { CloudSun, Utensils } from 'lucide-react';

interface PillarsLayoutProps {
    members: IHouseholdMemberProfile[];
    mealPlans: any[];
    onMemberClick: (m: IHouseholdMemberProfile) => void;
}

const PillarsLayout: React.FC<PillarsLayoutProps> = ({ members, mealPlans, onMemberClick }) => {
    // Meal
    const today = new Date().toISOString().split('T')[0];
    const dinner = mealPlans.flatMap(p => p.meals).find((m: any) =>
        (typeof m.date === 'string' ? m.date : m.date.toISOString()).startsWith(today) && m.mealType === 'Dinner'
    );

    return (
        <div className="h-full flex flex-col bg-white rounded-xl border border-border-subtle overflow-hidden">
            {/* Top Header Bar (15%) */}
            <div className="h-[15%] bg-bg-surface border-b border-border-subtle px-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">
                        {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </h1>
                    <p className="text-text-secondary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-xs uppercase font-bold text-text-tertiary mb-1 flex items-center gap-1">
                        <Utensils className="w-3 h-3" /> Tonight
                    </div>
                    <div className="text-xl font-bold text-action-primary">
                        {dinner ? (dinner.itemId?.name || dinner.customTitle) : "Open Kitchen"}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-text-secondary">
                    <CloudSun className="w-8 h-8" />
                    <div className="text-right">
                        <div className="font-bold">72°</div>
                        <div className="text-xs">Sunny</div>
                    </div>
                </div>
            </div>

            {/* Scrollable Pillars Body (85%) */}
            <div className="h-[85%] overflow-x-auto flex">
                {members.map(m => (
                    <MemberScheduleColumn
                        key={m._id}
                        member={m}
                        onHeaderClick={() => onMemberClick(m)}
                    />
                ))}

                {/* Spacer to prevent cut-off */}
                <div className="w-8 shrink-0"></div>
            </div>
        </div>
    );
};

export default PillarsLayout;
