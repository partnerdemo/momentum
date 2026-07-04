// =========================================================
// silkpanda/momentum/app/components/members/AddMemberModal.tsx
// REFACTORED for Unified Membership Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Removed local PROFILE_COLORS
// and imported from /app/lib/constants.ts
// =========================================================
'use client';

import React, { useState } from 'react';
import { User, Loader, AlertTriangle, Check, UserPlus } from 'lucide-react'; // Removed X
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../../types';
import { PROFILE_COLORS } from '../../lib/constants';
import Modal from '../shared/Modal';

interface AddMemberModalProps {
    householdId: string;
    onClose: () => void;
    onMemberAdded: (newProfile: IHouseholdMemberProfile) => void;
    usedColors: string[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
    householdId, onClose, onMemberAdded, usedColors
}) => {
    const [firstName, setFirstName] = useState('');
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [role, setRole] = useState<'Parent' | 'Child'>('Child');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    // Get the first available color as a default
    const availableColors = PROFILE_COLORS.filter(c => !usedColors.includes(c.hex));
    const defaultColor = availableColors.length > 0 ? availableColors[0].hex : PROFILE_COLORS[0].hex;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName.trim() === '') {
            setError('First Name is required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const colorToSubmit = selectedColor || defaultColor;

        try {
            // REFACTORED (v4): Call the Embedded BFF endpoint
            // We now pass the householdId in the body for the BFF to use.
            const response = await fetch(`/web-bff/family/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    householdId: householdId, // Pass householdId for the BFF
                    firstName: firstName,
                    displayName: firstName, // Use firstName as default displayName
                    profileColor: colorToSubmit,
                    role: role,
                }),
            });

            const data = await response.json();
            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                throw new Error(data.message || 'Failed to create profile.');
            }

            // The new API controller returns the updated household document.
            // We need to find the newly added member profile.
            const newProfileData = data.data.household.memberProfiles.find(
                (p: IHouseholdMemberProfile) => p.displayName === firstName && p.role === role
            );

            // Pass the new profile back to the list
            if (newProfileData) {
                onMemberAdded(newProfileData);
            }
            onClose(); // Close the modal on success

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add New Family Member" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <p className="text-sm text-text-secondary pb-2">
                    Create a new profile for your family team.
                </p>

                {/* First Name Input */}
                <div className="space-y-1">
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary">
                        Name (Login & Display Name)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <User className="h-5 w-5 text-text-secondary" />
                        </div>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="e.g., 'Alex'"
                            className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                        />
                    </div>
                </div>

                {/* Role: Defaults to Child (Hidden) */}
                <input type="hidden" name="role" value="Child" />

                {/* Color Picker */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-secondary">
                        Profile Color
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border border-border-subtle">
                        {availableColors.map((color) => (
                            <button
                                type="button"
                                key={color.hex}
                                title={color.name}
                                onClick={() => setSelectedColor(color.hex)}
                                className={`w-8 h-8 rounded-full border-2 transition-all
                            ${(selectedColor || defaultColor) === color.hex ? 'border-action-primary ring-2 ring-action-primary/50 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color.hex }}
                            >
                                {(selectedColor || defaultColor) === color.hex && <Check className="w-5 h-5 text-white m-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="flex items-center text-sm text-signal-alert">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-action-primary/60' : 'bg-action-primary hover:bg-action-hover'}`}
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 mr-2" />}
                    Add Member
                </button>
            </form>
        </Modal>
    );
};

export default AddMemberModal;