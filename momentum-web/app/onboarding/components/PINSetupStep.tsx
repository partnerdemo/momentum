import React from 'react';
import { Loader } from 'lucide-react';

interface PINSetupStepProps {
    pin: string;
    setPin: (pin: string) => void;
    pinConfirm: string;
    setPinConfirm: (pin: string) => void;
    isLoading: boolean;
    onBack: () => void;
    onComplete: () => void;
}

export default function PINSetupStep({
    pin,
    setPin,
    pinConfirm,
    setPinConfirm,
    isLoading,
    onBack,
    onComplete,
}: PINSetupStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Set Up Your PIN
                </h2>
                <p className="text-text-secondary">
                    Create a 4-digit PIN to secure your account
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Enter PIN
                    </label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-action-primary"
                        placeholder="••••"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Confirm PIN
                    </label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-action-primary"
                        placeholder="••••"
                    />
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
                        onClick={onComplete}
                        disabled={pin.length !== 4 || pinConfirm.length !== 4 || isLoading}
                        className={`flex-1 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm text-white transition-all duration-200 ${pin.length !== 4 || pinConfirm.length !== 4 || isLoading
                                ? 'bg-action-primary/60 cursor-not-allowed'
                                : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'
                            }`}
                    >
                        {isLoading && <Loader className="w-5 h-5 mr-2 animate-spin" />}
                        Complete Setup
                    </button>
                </div>
            </div>
        </div>
    );
}
