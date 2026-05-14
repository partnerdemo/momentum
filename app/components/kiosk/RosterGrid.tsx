import React from 'react';
import { IHouseholdMemberProfile, ITask } from '../../types';
import { Flame, Star, CheckCircle, Circle, LockOpen } from 'lucide-react';

interface RosterGridProps {
    members: IHouseholdMemberProfile[];
    tasks: ITask[];
    onMemberClick: (member: IHouseholdMemberProfile) => void;
}

const RosterGrid: React.FC<RosterGridProps> = ({ members, tasks, onMemberClick }) => {

    const getMemberTasks = (memberId: string) => {
        return tasks.filter(task =>
            !task.completedBy &&
            task.status !== 'Approved' &&
            task.assignedTo?.some(assignee => assignee._id === memberId)
        );
    };

    // Sort to keep Parents first, then Kids
    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'Parent' && b.role !== 'Parent') return -1;
        if (a.role !== 'Parent' && b.role === 'Parent') return 1;
        return a.displayName.localeCompare(b.displayName);
    });

    return (
        <div className="grid grid-cols-4 gap-10 mb-12">
            {sortedMembers.map((member) => {
                const memberTasks = getMemberTasks(member._id);
                const totalTasks = tasks.filter(t => t.assignedTo?.some(a => a._id === member._id)).length;
                const completedTasks = totalTasks - memberTasks.length;
                const progress = totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100);

                const iconColorStr = member.profileColor || '#0058ba'; // Primary Fallback

                return (
                    <div 
                        key={member._id}
                        onClick={() => onMemberClick(member)}
                        className="bg-white rounded-2xl p-8 bento-card-shadow flex flex-col cursor-pointer hover:-translate-y-2 transition-all duration-300 group border-t-8 h-[600px]"
                        style={{ borderTopColor: iconColorStr }}
                    >
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full object-cover border-4 flex items-center justify-center font-black text-4xl text-white shadow-inner" style={{ borderColor: `${iconColorStr}40`, backgroundColor: iconColorStr }}>
                                    {member.displayName[0]}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center" style={{ backgroundColor: iconColorStr }}>
                                    <Star className="text-white w-5 h-5 fill-current" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-gray-900">{member.displayName}</h3>
                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: iconColorStr }}>
                                    {member.role}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1.5 bg-orange-100 px-3 py-1.5 rounded-full">
                                <Flame className="text-orange-600 w-4 h-4 fill-current" />
                                <span className="text-[11px] font-black text-orange-900">{member.currentStreak || 0} DAY STREAK</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${iconColorStr}15` }}>
                                <span className="text-[11px] font-black" style={{ color: iconColorStr }}>
                                    {member.pointsTotal || 0} PTS
                                </span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500">Daily Progress</span>
                                <span className="text-xs font-black" style={{ color: iconColorStr }}>{progress}%</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: iconColorStr, width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            {memberTasks.slice(0, 2).map((task) => (
                                <div key={task._id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Circle className="text-gray-400 w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium truncate">{task.title}</span>
                                </div>
                            ))}
                            {completedTasks > 0 && memberTasks.length < 2 && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg opacity-50">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: iconColorStr }} />
                                    <span className="font-bold">Tasks Completed</span>
                                </div>
                            )}
                            
                            <div className="mt-auto pt-6 border-t border-gray-200 flex flex-col items-center gap-2">
                                <LockOpen style={{ color: iconColorStr }} className="w-6 h-6" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: iconColorStr }}>Tap to Unlock</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RosterGrid;
