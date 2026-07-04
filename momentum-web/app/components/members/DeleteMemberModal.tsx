// =========================================================
// silkpanda/momentum/momentum-fac69d659346d6b7b01871d803baa24f6dfaccee/app/components/members/DeleteMemberModal.tsx
// REFACTORED for Unified Membership Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
// =========================================================
'use client';

import React, { useState } from 'react';
import { Loader, AlertTriangle, Trash } from 'lucide-react'; // Removed X
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../../types';
import Modal from '../shared/Modal';

interface DeleteMemberModalProps {
    member: IHouseholdMemberProfile;
    householdId: string;
    onClose: () => void;
    onMemberDeleted: () => void; // Function to trigger a re-fetch
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
    member, householdId, onClose, onMemberDeleted
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const handleDelete = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // DELETE to the 'deleteMemberProfile' endpoint
            // The API endpoint uses the sub-document _id
            // REFACTORED (v4): Call the Embedded BFF endpoint
            // We must pass householdId as a query param for the BFF
            const response = await fetch(`/web-bff/family/members/${member._id}?householdId=${householdId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete member.');
            }

            // Call the refresh function passed from the parent
            onMemberDeleted();
            onClose(); // Close the modal on success

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} maxWidth="max-w-md">
            <div className="flex justify-center">
                <div className="p-3 bg-signal-alert/10 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-signal-alert" />
                </div>
            </div>

            <h3 className="text-xl font-medium text-text-primary text-center mt-4">
                Delete Member?
            </h3>
            <p className="text-sm text-text-secondary text-center mt-2">
                Are you sure you want to delete <strong className="text-text-primary">{member.displayName}</strong>?
                This will remove them from this household. This action cannot be undone.
            </p>

            {/* Error Display */}
            {error && (
                <div className="flex items-center text-sm text-signal-alert mt-4 p-3 bg-signal-alert/10 rounded-md border border-signal-alert/20">
                    <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                       text-text-secondary bg-border-subtle hover:bg-border-subtle/80"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className={`w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-signal-alert/60' : 'bg-signal-alert hover:bg-signal-alert/80'}`}
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Trash className="w-5 h-5 mr-2" />}
                    Yes, Delete
                </button>
            </div>
        </Modal>
    );
};

export default DeleteMemberModal;