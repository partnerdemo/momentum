// =========================================================
// silkpanda/momentum/momentum-aed7f8804ec93e3a89b85f13a44796c67e349b99/app/components/members/MemberList.tsx
// REFACTORED for Unified Membership Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Implemented optimistic state updates
// for Update and Delete to improve UI performance.
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertTriangle, UserPlus, Trash, Edit, User, Award, ChevronDown } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import DeleteMemberModal from './DeleteMemberModal';
import { ITask } from '../../types'; // <-- UPDATED IMPORT
import MemberProfileModal from './MemberProfileModal';
import CollapsibleSection from '../layout/CollapsibleSection';
import { IHouseholdMemberProfile } from '../../types'; // <-- UPDATED IMPORT

// --- Unified Member Item Component ---
const MemberItem: React.FC<{
    member: IHouseholdMemberProfile;
    isSelf: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onOpenProfile: () => void;
    assignedTaskCount: number;
}> = ({ member, isSelf, onEdit, onDelete, onOpenProfile, assignedTaskCount }) => (
    <li className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
        <button onClick={onOpenProfile} className="flex items-center space-x-4 text-left hover:opacity-80 transition-opacity">
            {/* Conditional Avatar: Color for child, icon for parent */}
            {member.profileColor ? (
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: member.profileColor }}
                >
                    {member.displayName.charAt(0).toUpperCase()}
                </div>
            ) : (
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-border-subtle text-text-secondary"
                >
                    <User className="w-5 h-5" />
                </div>
            )}
            <div>
                <p className="text-base font-medium text-text-primary">
                    {member.displayName} {isSelf && '(You)'}
                </p>
                <p className="text-sm text-text-secondary">
                    {member.role === 'Parent' ? member.familyMemberId.email : 'Child Profile'}
                </p>
            </div>
        </button>
        <div className="flex items-center space-x-4">
            {/* Points: Show for all members */}
            <div className="text-center w-16">
                <p className="text-lg font-semibold text-action-primary">{member.pointsTotal}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>

            {/* Assigned Task Count */}
            <div className="text-center w-16 flex items-center justify-center space-x-1.5">
                <Award className="w-4 h-4 text-text-secondary" />
                <p className="text-lg font-semibold text-text-primary">{assignedTaskCount}</p>
            </div>

            {/* Actions */}
            <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Member">
                <Edit className="w-4 h-4" />
            </button>
            {/* Disable delete button for parents (and self) */}
            <button
                onClick={onDelete}
                className="p-2 text-text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={member.role === 'Parent' ? 'Parents cannot be removed from this screen' : 'Remove Member'}
                disabled={member.role === 'Parent'}
            >
                <Trash className="w-4 h-4" />
            </button>
        </div>
    </li>
);

// --- Main Member List Component ---
const MemberList: React.FC = () => {
    // State now holds the single, unified array from the API
    const [memberProfiles, setMemberProfiles] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);

    // Use the session context to get the householdId and token
    const { user, householdId, token } = useSession();

    // Updated to fetch all required data
    const fetchData = useCallback(async () => {
        if (!householdId || !token) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // REFACTORED (v4): Call the single Embedded BFF aggregation endpoint
            const response = await fetch('/web-bff/family/members/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to fetch member page data from BFF.');

            const data = await response.json();

            if (data.memberProfiles && data.tasks) {
                setMemberProfiles(data.memberProfiles);
                setTasks(data.tasks);
            } else {
                throw new Error('BFF returned malformed data.');
            }

            setError(null);

        } catch (e: any) {
            setError(`Failed to load family members or tasks: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [householdId, token]);

    useEffect(() => {
        fetchData(); // Call fetch on initial load
    }, [fetchData]);

    const handleMemberAdded = (newProfile: IHouseholdMemberProfile) => {
        setMemberProfiles(current => [...current, newProfile]);
    };

    const handleMemberUpdated = (updatedProfile: IHouseholdMemberProfile) => {
        setMemberProfiles(current => current.map(m => m._id === updatedProfile._id ? updatedProfile : m));
    };

    const handleMemberDeleted = () => {
        setMemberProfiles(current => current.filter(m => m._id !== selectedMember?._id));
    };

    // Click Handlers for opening modals
    const openEditModal = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsDeleteModalOpen(true);
    };

    // Click Handler for new Profile Modal
    const openProfileModal = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsProfileModalOpen(true);
    };

    /**
     * Helper to count assigned, incomplete tasks for a member.
     * We use the member._id (Profile ID) for matching.
     */
    const getAssignedTaskCount = (memberId: string) => {
        return tasks.filter(task =>
            !task.isCompleted &&
            task.assignedTo.some(profile => profile._id === memberId)
        ).length;
    };

    if (loading && memberProfiles.length === 0) {
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading members...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header and "Add Member" Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {memberProfiles.length} Total Member(s)
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                {/* Mandated Button: Icon + Text Label */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add New Member
                </button>
            </div>

            {/* --- NEW: Filter members into sections --- */}
            {(() => {
                const parentProfiles = memberProfiles.filter(m => m.role === 'Parent');
                const childProfiles = memberProfiles.filter(m => m.role === 'Child');

                return (
                    memberProfiles.length > 0 ? (
                        <div className="space-y-4">
                            <CollapsibleSection
                                Icon={User}
                                title="Parents"
                                count={parentProfiles.length}
                                defaultOpen={true}
                                emptyMessage="No parents in this section."
                            >
                                {parentProfiles.map((member) => (
                                    <MemberItem key={member._id} member={member} isSelf={member.familyMemberId._id === user?._id} onEdit={() => openEditModal(member)} onDelete={() => openDeleteModal(member)} onOpenProfile={() => openProfileModal(member)} assignedTaskCount={getAssignedTaskCount(member._id)} />
                                ))}
                            </CollapsibleSection>

                            <CollapsibleSection
                                Icon={User}
                                title="Children"
                                count={childProfiles.length}
                                emptyMessage="No children in this section."
                            >
                                {childProfiles.map((member) => (
                                    <MemberItem
                                        key={member._id} // Use sub-document ID
                                        member={member}
                                        isSelf={member.familyMemberId._id === user?._id} // Check if self
                                        onEdit={() => openEditModal(member)}
                                        onDelete={() => openDeleteModal(member)}
                                        onOpenProfile={() => openProfileModal(member)} // Pass handler
                                        assignedTaskCount={getAssignedTaskCount(member._id)} // Pass count
                                    />
                                ))}
                            </CollapsibleSection>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                            <User className="w-12 h-12 mx-auto text-text-secondary/50" />
                            <p className="mt-4 text-text-secondary">No child profiles found.</p>
                            <p className="text-sm text-text-secondary/80">Click "Add New Member" to get started.</p>
                        </div>
                    )
                );
            })()}

            {/* Conditionally render the modal */}
            {isAddModalOpen && (
                <AddMemberModal
                    householdId={householdId!} // householdId is guaranteed to exist here
                    onClose={() => setIsAddModalOpen(false)}
                    onMemberAdded={handleMemberAdded}
                    // Pass the list of already used colors
                    usedColors={memberProfiles.map(p => p.profileColor).filter(Boolean) as string[]}
                />
            )}

            {/* Conditionally render Profile Modal */}
            {isProfileModalOpen && selectedMember && (
                <MemberProfileModal
                    member={selectedMember}
                    allTasks={tasks}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            )}

            {/* Conditionally render Edit Modal */}
            {isEditModalOpen && selectedMember && (
                <EditMemberModal
                    member={selectedMember}
                    onClose={() => setIsEditModalOpen(false)}
                    onMemberUpdated={handleMemberUpdated}
                    onMemberDeleted={handleMemberDeleted}
                />
            )}

            {/* Conditionally render Delete Modal */}
            {isDeleteModalOpen && selectedMember && (
                <DeleteMemberModal
                    member={selectedMember}
                    householdId={householdId!}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onMemberDeleted={handleMemberDeleted}
                />
            )}
        </div>
    );
};

export default MemberList;