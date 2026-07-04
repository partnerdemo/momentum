import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../../types';
import { User, CheckCircle } from 'lucide-react';

interface HorizontalRosterProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    onMemberClick: (member: IHouseholdMemberProfile) => void;
}

const HorizontalRoster: React.FC<HorizontalRosterProps> = ({ members, tasks, onMemberClick }) => {
    return (
        <div className="h-full flex items-center space-x-6 overflow-x-auto p-4">
            {members.map(member => {
                const pendingTasks = tasks.filter(t =>
                    t.status !== 'Approved' && t.assignedTo?.some(a => a._id === member._id)
                ).length;

                return (
                    <button
                        key={member._id}
                        onClick={() => onMemberClick(member)}
                        className="flex-shrink-0 flex flex-col items-center group"
                    >
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white group-hover:border-action-primary transition-all relative"
                            style={{ backgroundColor: member.profileColor || '#999' }}
                        >
                            {member.displayName[0]}
                            {pendingTasks > 0 && (
                                <div className="absolute -top-1 -right-1 bg-signal-success w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white">
                                    {pendingTasks}
                                </div>
                            )}
                        </div>
                        <span className="mt-2 font-medium text-text-primary group-hover:text-action-primary">{member.displayName}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default HorizontalRoster;
