import React from 'react';
import { Home } from 'lucide-react';

interface HouseholdSetupStepProps {
    householdName: string;
    setHouseholdName: (name: string) => void;
    inviteCode: string;
    setInviteCode: (code: string) => void;
    hasInviteCode: boolean;
    setHasInviteCode: (has: boolean) => void;
    setError: (error: string | null) => void;
    onContinue: () => void;
}

export default function HouseholdSetupStep({
    householdName,
    setHouseholdName,
    inviteCode,
    setInviteCode,
    hasInviteCode,
    setHasInviteCode,
    setError,
    onContinue,
}: HouseholdSetupStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Household Setup
                </h2>
                <p className="text-text-secondary">
                    Create a new household or join an existing one
                </p>
            </div>

            {/* Toggle between create and join */}
            <div className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg border border-border-subtle">
                <span className="text-sm font-medium text-text-primary">Joining an existing household?</span>
                <button
                    type="button"
                    onClick={() => {
                        setHasInviteCode(!hasInviteCode);
                        setError(null);
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasInviteCode ? 'bg-action-primary' : 'bg-border-subtle'
                        }`}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasInviteCode ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            {hasInviteCode ? (
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Invite Code
                    </label>
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="e.g., A1B2C3"
                        className="w-full px-4 py-3 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-action-primary"
                    />
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Household Name
                    </label>
                    <input
                        type="text"
                        value={householdName}
                        onChange={(e) => setHouseholdName(e.target.value)}
                        placeholder="e.g., 'The Smith Family'"
                        className="w-full px-4 py-3 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-action-primary"
                    />
                </div>
            )}

            <button
                onClick={onContinue}
                className="w-full py-3 px-4 bg-action-primary text-white rounded-lg font-medium hover:bg-action-hover transition-colors"
            >
                Continue
            </button>
        </div>
    );
}
