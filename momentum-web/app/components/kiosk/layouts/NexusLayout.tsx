import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../../types';
import TimelineCard from '../TimelineCard';
import RosterGrid from '../RosterGrid';
import EnvironmentColumn from '../EnvironmentColumn';

interface NexusLayoutProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    mealPlans: any[];
    recipes: any[];
    quests: any[];
    onMemberClick: (member: IHouseholdMemberProfile) => void;
    onFocusClick: (e: React.MouseEvent, member: IHouseholdMemberProfile) => void;
}

const NexusLayout: React.FC<NexusLayoutProps> = ({
    members,
    tasks,
    mealPlans,
    recipes,
    quests,
    onMemberClick,
    onFocusClick
}) => {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            {/* Column 1: Responsibilities / Squad Status */}
            <div className="col-span-12 lg:col-span-4 h-full min-h-[400px]">
                <RosterGrid
                    members={members}
                    tasks={tasks}
                    onMemberClick={onMemberClick}
                />
            </div>

            {/* Column 2: Quests & Rewards (Environment) */}
            <div className="col-span-12 lg:col-span-4 h-full min-h-[400px]">
                <EnvironmentColumn
                    mealPlans={mealPlans}
                    recipes={recipes}
                    quests={quests}
                />
            </div>

            {/* Column 3: The Schedule (Timeline) */}
            <div className="col-span-12 lg:col-span-4 h-full min-h-[400px]">
                <TimelineCard />
            </div>
        </div>
    );
};

export default NexusLayout;
