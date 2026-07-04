// =========================================================
// silkpanda/momentum/app/components/members/MemberProfileModal.tsx
// New modal to display a member's profile and task lists
// =========================================================
'use client';


import React from 'react';
import { Award, CheckCircle, User } from 'lucide-react'; // Removed X
import { IHouseholdMemberProfile, ITask } from '../../types';
import Modal from '../shared/Modal';

// --- Props Interface ---
interface MemberProfileModalProps {
    member: IHouseholdMemberProfile;
    allTasks: ITask[];
    onClose: () => void;
}

// --- Reusable Task Row Component ---
const ProfileTaskItem: React.FC<{ task: ITask; isComplete: boolean }> = ({ task, isComplete }) => (
    <li className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg border border-border-subtle">
        <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 p-2 rounded-lg ${isComplete ? 'bg-signal-success/10' : 'bg-action-primary/10'}`}>
                {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-signal-success" />
                ) : (
                    <Award className="w-4 h-4 text-action-primary" />
                )}
            </div>
            <div>
                <p className={`text-sm font-medium ${isComplete ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                    {task.title}
                </p>
                <p className="text-xs text-text-secondary">{task.description || 'No description'}</p>
            </div>
        </div>
        <div className="text-right">
            <p className={`text-sm font-semibold ${isComplete ? 'text-text-secondary' : 'text-signal-success'}`}>
                +{task.pointsValue}
            </p>
            <p className="text-xs text-text-secondary">Points</p>
        </div>
    </li>
);

// --- Main Modal Component ---
const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ member, allTasks, onClose }) => {

    // Filter tasks for this specific member
    // FIX: Compare task.assignedTo._id (Profile ID) with member._id (Profile ID)
    const incompleteTasks = allTasks.filter(task =>
        !task.isCompleted &&
        task.assignedTo.some(profile => profile._id === member._id)
    );

    const completedTasks = allTasks.filter(task =>
        task.isCompleted &&
        task.assignedTo.some(profile => profile._id === member._id)
    );

    return (
        <Modal isOpen={true} onClose={onClose} title={member.displayName}>
            {/* Header Summary */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                <div className="flex items-center space-x-4">
                    <div
                        className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl"
                        style={{ backgroundColor: member.profileColor || '#6B7280' }}
                    >
                        {member.role === 'Parent' ? <User className="w-8 h-8" /> : member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-base text-text-secondary">{member.role}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-semibold text-action-primary">{member.pointsTotal}</p>
                    <p className="text-sm text-text-secondary">Total Points</p>
                </div>
            </div>

            {/* Task Lists */}
            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Assigned (Incomplete) Tasks */}
                <div>
                    <h4 className="text-lg font-medium text-text-primary mb-2">Assigned Tasks ({incompleteTasks.length})</h4>
                    {incompleteTasks.length > 0 ? (
                        <ul className="space-y-2">
                            {incompleteTasks.map(task => (
                                <ProfileTaskItem key={task._id} task={task} isComplete={false} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-text-secondary text-center p-4 bg-bg-canvas rounded-lg">
                            No assigned tasks.
                        </p>
                    )}
                </div>

                {/* Completed Tasks */}
                <div>
                    <h4 className="text-lg font-medium text-text-primary mb-2">Completed Tasks ({completedTasks.length})</h4>
                    {completedTasks.length > 0 ? (
                        <ul className="space-y-2">
                            {completedTasks.map(task => (
                                <ProfileTaskItem key={task._id} task={task} isComplete={true} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-text-secondary text-center p-4 bg-bg-canvas rounded-lg">
                            No completed tasks found.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MemberProfileModal;