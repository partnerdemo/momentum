import React from 'react';
import { IHouseholdMemberProfile } from '../../../types';
import { User } from 'lucide-react';

interface MemberSmartCardProps {
    member: IHouseholdMemberProfile;
    taskCount: number;
    onClick: () => void;
}

const MemberSmartCard: React.FC<MemberSmartCardProps> = ({ member, taskCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="bg-white rounded-lg shadow-sm hover:shadow-md border border-border-subtle p-3 flex items-center gap-3 w-full text-left transition-all hover:border-action-primary"
        >
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: member.profileColor || '#999' }}
            >
                {member.displayName[0]}
            </div>

            <div className="min-w-0">
                <h4 className="font-bold text-text-primary truncate leading-tight">{member.displayName}</h4>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                    {taskCount > 0 ? (
                        <span className="text-signal-alert font-medium">{taskCount} Tasks Due</span>
                    ) : (
                        <span className="text-signal-success">All Clear</span>
                    )}
                </p>
            </div>
        </button>
    );
};

export default MemberSmartCard;
