import React from 'react';
import { Check } from 'lucide-react';
import { PROFILE_COLORS } from '../../lib/constants';

interface ProfileSetupStepProps {
    displayName: string;
    setDisplayName: (name: string) => void;
    selectedColor: string;
    setSelectedColor: (color: string) => void;
    calendarChoice: 'sync' | 'create' | null;
    onBack: () => void;
    onContinue: () => void;
}

export default function ProfileSetupStep({
    displayName,
    setDisplayName,
    selectedColor,
    setSelectedColor,
    calendarChoice,
    onBack,
    onContinue,
}: ProfileSetupStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Profile Setup
                </h2>
                <p className="text-text-secondary">
                    Customize your profile
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g., 'Mom' or 'Dad'"
                        className="w-full px-4 py-3 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-action-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Your Profile Color
                    </label>
                    <div className="flex flex-wrap gap-3 p-4 bg-bg-canvas rounded-lg border border-border-subtle">
                        {PROFILE_COLORS.map((color) => (
                            <button
                                key={color.hex}
                                type="button"
                                onClick={() => setSelectedColor(color.hex)}
                                className={`w-10 h-10 rounded-full border-3 transition-all ${selectedColor === color.hex
                                        ? 'border-action-primary ring-2 ring-action-primary/50 scale-110'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                style={{ backgroundColor: color.hex }}
                            >
                                {selectedColor === color.hex && (
                                    <Check className="w-5 h-5 text-white m-auto" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={onContinue}
                        disabled={!displayName.trim()}
                        className={`flex-1 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm text-white transition-all duration-200 ${!displayName.trim()
                                ? 'bg-action-primary/60 cursor-not-allowed'
                                : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'
                            }`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
