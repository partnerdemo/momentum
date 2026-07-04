import React from 'react';
import { IHouseholdMemberProfile } from '../../../types';
import PulseHero from '../widgets/PulseHero';
import { Clock, Utensils, Target } from 'lucide-react';

interface PulseLayoutProps {
    members: IHouseholdMemberProfile[];
    mealPlans: any[];
    quests: any[];
    onMemberClick: (m: IHouseholdMemberProfile) => void;
}

const PulseLayout: React.FC<PulseLayoutProps> = ({ members, mealPlans, quests, onMemberClick }) => {

    // Simple Environment Data
    const today = new Date().toISOString().split('T')[0];
    const dinner = mealPlans.flatMap(p => p.meals).find((m: any) =>
        (typeof m.date === 'string' ? m.date : m.date.toISOString()).startsWith(today) && m.mealType === 'Dinner'
    );
    const dinnerName = dinner ? (dinner.itemId?.name || dinner.customTitle) : "No Dinner Planned";

    const activeQuest = quests.find((q: any) => q.status === 'Active');

    return (
        <div className="h-full flex overflow-hidden rounded-3xl bg-bg-canvas border border-border-subtle">
            {/* Left Sidebar (Member List) */}
            <div className="w-[120px] bg-white border-r border-border-subtle flex flex-col items-center py-8 gap-6 overflow-y-auto hide-scrollbar">
                {members.map(m => (
                    <button
                        key={m._id}
                        onClick={() => onMemberClick(m)}
                        className="flex flex-col items-center group transition-all"
                    >
                        <div
                            className="w-16 h-16 rounded-full border-2 border-white shadow-md group-hover:scale-110 group-hover:border-action-primary transition-all flex items-center justify-center text-lg font-bold text-white mb-2"
                            style={{ backgroundColor: m.profileColor || '#999' }}
                        >
                            {m.displayName[0]}
                        </div>
                    </button>
                ))}
            </div>

            {/* Center Hero */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-br from-bg-canvas to-white">
                <PulseHero />
            </div>

            {/* Right Sidebar (Context) */}
            <div className="w-[300px] bg-white border-l border-border-subtle flex flex-col p-6 gap-6">
                {/* Clock Card */}
                <div className="bg-bg-canvas p-6 rounded-2xl text-center">
                    <Clock className="w-8 h-8 mx-auto text-action-primary mb-2" />
                    <h2 className="text-3xl font-bold text-text-primary">
                        {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </h2>
                    <p className="text-text-secondary">{new Date().toLocaleDateString()}</p>
                </div>

                {/* Meal Card */}
                <div className="flex-1 bg-action-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <Utensils className="w-8 h-8 text-action-primary mb-3" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tonight's Fuel</span>
                    <h3 className="text-xl font-bold text-text-primary mt-2">{dinnerName}</h3>
                </div>

                {/* Quest Card */}
                <div className="flex-1 bg-signal-success/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <Target className="w-8 h-8 text-signal-success mb-3" />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Current Quest</span>
                    <h3 className="text-lg font-bold text-text-primary mt-2">{activeQuest ? activeQuest.title : 'No Active Quest'}</h3>
                </div>
            </div>
        </div>
    );
};

export default PulseLayout;
