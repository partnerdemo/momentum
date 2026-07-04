'use client';

import React, { useState } from 'react';
import { User, Loader, AlertTriangle, Check, Save, Trash2 } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../../types';
import { PROFILE_COLORS } from '../../lib/constants';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';

interface EditMemberModalProps {
    member: IHouseholdMemberProfile;
    onClose: () => void;
    onMemberUpdated: (updatedProfile: IHouseholdMemberProfile) => void;
    onMemberDeleted: (memberId: string) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
    member, onClose, onMemberUpdated, onMemberDeleted
}) => {
    const { token, householdId } = useSession();
    const [firstName, setFirstName] = useState(member.displayName);
    const [selectedColor, setSelectedColor] = useState<string>(member.profileColor || PROFILE_COLORS[0].hex);
    const [role, setRole] = useState<'Parent' | 'Child'>(member.role);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName.trim() === '') {
            setError('First Name is required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/web-bff/family/members/${member._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    householdId,
                    firstName: firstName.trim(),
                    displayName: firstName.trim(),
                    role,
                    profileColor: selectedColor,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update member');
            }

            let updatedProfile = data.data?.memberProfile;

            if (!updatedProfile && data.memberProfiles) {
                updatedProfile = data.memberProfiles.find(
                    (p: IHouseholdMemberProfile) => p._id === member._id
                );
            }

            if (updatedProfile) {
                onMemberUpdated(updatedProfile);
            } else {
                // Fallback optimistic update
                onMemberUpdated({ ...member, displayName: firstName, role, profileColor: selectedColor });
            }

            onClose();
        } catch (err: any) {
            console.error('Update member error:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/web-bff/family/members/${member._id}?householdId=${householdId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete member');
            }

            onMemberDeleted(member._id);
            onClose();
        } catch (err: any) {
            console.error('Delete member error:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsDeleting(false);
            setIsConfirmDeleteOpen(false);
        }
    };

    return (
        <>
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Remove Member"
                message={`Are you sure you want to remove ${member.displayName}? This cannot be undone.`}
                confirmText="Remove"
                variant="danger"
            />

            <Modal isOpen={true} onClose={onClose} title="Edit Member">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            First Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-text-tertiary" />
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full pl-10 p-3 rounded-lg border border-border-subtle bg-bg-canvas text-text-primary focus:ring-2 focus:ring-action-primary/20 focus:border-action-primary outline-none transition-all"
                                placeholder="e.g. Alice"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Role
                        </label>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setRole('Child')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${role === 'Child'
                                    ? 'border-action-primary bg-action-primary/5 text-action-primary'
                                    : 'border-border-subtle hover:border-action-primary/50 text-text-secondary'
                                    }`}
                            >
                                Child
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('Parent')}
                                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium ${role === 'Parent'
                                    ? 'border-action-primary bg-action-primary/5 text-action-primary'
                                    : 'border-border-subtle hover:border-action-primary/50 text-text-secondary'
                                    }`}
                            >
                                Parent
                            </button>
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Profile Color
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {PROFILE_COLORS.map((color) => (
                                <button
                                    key={color.hex}
                                    type="button"
                                    onClick={() => setSelectedColor(color.hex)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                >
                                    {selectedColor === color.hex && (
                                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center text-sm text-signal-alert bg-signal-alert/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 pt-4 border-t border-border-subtle">
                        <button
                            type="submit"
                            disabled={isLoading || isDeleting}
                            className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                            ${isLoading ? 'bg-action-primary/70 cursor-not-allowed' : 'bg-action-primary hover:bg-action-primary/90 shadow-md hover:shadow-lg'}`}
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsConfirmDeleteOpen(true)}
                            disabled={isLoading || isDeleting}
                            className={`w-full flex justify-center items-center py-3 px-4 rounded-lg font-medium transition-all border border-signal-alert text-signal-alert hover:bg-signal-alert/5
                            ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isDeleting ? <Loader className="w-5 h-5 animate-spin" /> : <><Trash2 className="w-5 h-5 mr-2" /> Remove Member</>}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default EditMemberModal;