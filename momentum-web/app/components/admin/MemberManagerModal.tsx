'use client';

import React, { useState } from 'react';
import { Users, Plus, Edit2, Shield, User } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';
import AddMemberModal from '../members/AddMemberModal';
import MemberDetailModal from '../members/MemberDetailModal';
import { IHouseholdMemberProfile } from '../../types';

interface MemberManagerModalProps {
    onClose: () => void;
}

const MemberManagerModal: React.FC<MemberManagerModalProps> = ({ onClose }) => {
    const { householdId } = useSession();
    const { members } = useFamilyData();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title="Family Members">
                <div className="space-y-4">
                    {/* Header Actions */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                            Manage household members
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">Add</span>
                        </button>
                    </div>

                    {/* Member List */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {members.map((member) => (
                            <button
                                key={member._id}
                                onClick={() => setSelectedMember(member)}
                                className="w-full flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl hover:shadow-md transition-all"
                            >
                                <div className="flex items-center space-x-4">
                                    {/* Avatar */}
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                        style={{ backgroundColor: member.profileColor || '#6B7280' }}
                                    >
                                        {member.displayName.charAt(0)}
                                    </div>

                                    {/* Member Info */}
                                    <div className="text-left">
                                        <p className="text-text-primary font-semibold">
                                            {member.displayName}
                                        </p>
                                        <div className="flex items-center space-x-1 text-text-secondary text-sm">
                                            {member.role === 'Parent' ? (
                                                <Shield className="w-3 h-3" />
                                            ) : (
                                                <User className="w-3 h-3" />
                                            )}
                                            <span>{member.role}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Icon */}
                                <Edit2 className="w-4 h-4 text-text-secondary" />
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Add Member Modal */}
            {showAddModal && householdId && (
                <AddMemberModal
                    householdId={householdId}
                    usedColors={members.map(m => m.profileColor).filter((c): c is string => c !== undefined)}
                    onClose={() => setShowAddModal(false)}
                    onMemberAdded={() => {
                        setShowAddModal(false);
                        // Data will refresh via WebSocket
                    }}
                />
            )}

            {/* Member Detail Modal */}
            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </>
    );
};

export default MemberManagerModal;
