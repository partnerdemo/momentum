'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Loader2 } from 'lucide-react';
import { useSession } from '../layout/SessionContext';

interface PinVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
    title?: string;
    description?: string;
    memberId: string;
    householdId: string;
}

export default function PinVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    title = 'Enter PIN',
    description = 'Please enter your 4-digit PIN to continue.',
    memberId,
    householdId,
}: PinVerificationModalProps) {
    const { token } = useSession();
    const [mode, setMode] = useState<'verify' | 'setup' | 'confirm'>('verify');
    const [pin, setPin] = useState(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
    const [newPin, setNewPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode('verify');
            setPin(['', '', '', '']);
            setConfirmPin(['', '', '', '']);
            setNewPin('');
            setError(null);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Focus input when mode changes
    useEffect(() => {
        setPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        // Do NOT clear error here, so we can show API errors when switching back to setup
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
    }, [mode]);

    const handleChange = (index: number, value: string, isConfirm = false) => {
        if (value.length > 1) return; // Prevent multiple chars

        const currentPinState = isConfirm ? confirmPin : pin;
        const setPinState = isConfirm ? setConfirmPin : setPin;

        const newPinArr = [...currentPinState];
        newPinArr[index] = value;
        setPinState(newPinArr);
        setError(null);

        // Auto-advance
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit if complete
        if (index === 3 && value) {
            const fullPin = newPinArr.join('');
            if (fullPin.length === 4) {
                if (mode === 'verify') {
                    verifyPin(fullPin);
                } else if (mode === 'setup') {
                    setNewPin(fullPin);
                    setMode('confirm');
                } else if (mode === 'confirm') {
                    if (fullPin === newPin) {
                        setupPin(fullPin);
                    } else {
                        setError('PINs do not match. Try again.');
                        setConfirmPin(['', '', '', '']);
                        inputRefs.current[0]?.focus();
                    }
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isConfirm = false) => {
        const currentPinState = isConfirm ? confirmPin : pin;
        if (e.key === 'Backspace' && !currentPinState[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyPin = async (enteredPin: string) => {
        setIsLoading(true);
        setError(null);

        console.log('[PinVerificationModal] Verifying PIN with:', {
            memberId,
            householdId,
            pinLength: enteredPin.length,
            hasToken: !!token
        });

        // Dev Mock Interceptor
        if (token === 'mock_development_token') {
            await new Promise(resolve => setTimeout(resolve, 600));
            onSuccess({ verified: true });
            onClose();
            return;
        }

        try {
            const response = await fetch('/web-bff/pin/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pin: enteredPin, memberId, householdId }),
            });

            const contentType = response.headers.get("content-type") || "";
            let data: any = {};
            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || "Failed to verify PIN (Invalid server response)");
            }

            if (!response.ok) {
                // Check for "requiresSetup" flag from backend
                if (data.requiresSetup) {
                    setMode('setup');
                    setIsLoading(false);
                    return;
                }
                throw new Error(data.message || 'Failed to verify PIN');
            }

            onSuccess(data);
            onClose();

        } catch (err: any) {
            console.error("PIN Verification Error", err);
            setError(err.message || "Failed to verify PIN");
            setIsLoading(false);
            setPin(['', '', '', '']);
            inputRefs.current[0]?.focus();
        }
    };

    const setupPin = async (finalPin: string) => {
        console.log('[PinModal] Setting up PIN...');
        setIsLoading(true);
        setError(null);

        // Dev Mock Interceptor
        if (token === 'mock_development_token') {
            await new Promise(resolve => setTimeout(resolve, 600));
            onSuccess({ verified: true });
            onClose();
            return;
        }

        try {
            // Add timeout to prevent infinite hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch('/web-bff/pin/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pin: finalPin }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const contentType = response.headers.get("content-type") || "";
            let data: any = {};
            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || "Failed to set up PIN (Invalid server response)");
            }
            console.log('[PinModal] Setup response:', { status: response.status, data });

            if (!response.ok) {
                throw new Error(data.message || 'Failed to set up PIN');
            }

            // After setup, we consider them verified
            console.log('[PinModal] Setup success, calling onSuccess');
            onSuccess({ verified: true });
            onClose();

        } catch (err: any) {
            console.error("PIN Setup Error", err);
            if (err.name === 'AbortError') {
                setError("Request timed out. Please try again.");
            } else {
                setError(err.message || "Failed to set up PIN");
            }
            setIsLoading(false);
            setMode('setup'); // Go back to setup start
        }
    };

    const getTitle = () => {
        if (mode === 'setup') return 'Create New PIN';
        if (mode === 'confirm') return 'Confirm New PIN';
        return title;
    };

    const getDescription = () => {
        if (mode === 'setup') return 'No PIN found. Please create a 4-digit PIN.';
        if (mode === 'confirm') return 'Please re-enter your PIN to confirm.';
        return description;
    };

    const activePin = mode === 'confirm' ? confirmPin : pin;

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className={`bg-bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-border-subtle transform transition-all ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                    <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Lock className="w-5 h-5 text-action-primary" />
                        {getTitle()}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-bg-canvas"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center">
                    <p className="text-text-secondary text-center mb-8">
                        {getDescription()}
                    </p>

                    {/* PIN Inputs */}
                    <div className="flex gap-4 mb-8">
                        {activePin.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value, mode === 'confirm')}
                                onKeyDown={(e) => handleKeyDown(index, e, mode === 'confirm')}
                                disabled={isLoading}
                                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-bg-canvas text-text-primary focus:outline-none transition-all
                                    ${error
                                        ? 'border-signal-alert focus:border-signal-alert'
                                        : 'border-border-subtle focus:border-action-primary focus:ring-4 focus:ring-action-primary/10'
                                    }
                                `}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-signal-alert text-sm font-medium mb-4 animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-action-primary font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {mode === 'verify' ? 'Verifying...' : 'Setting up...'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
