'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, AlertTriangle } from 'lucide-react';
import { PROFILE_COLORS } from '../lib/constants';

// Step Components
import HouseholdSetupStep from './components/HouseholdSetupStep';
import CalendarSetupStep from './components/CalendarSetupStep';
import CalendarPickerStep from './components/CalendarPickerStep';
import ProfileSetupStep from './components/ProfileSetupStep';
import PINSetupStep from './components/PINSetupStep';

interface CalendarItem {
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
}

type Step = 'household' | 'calendar' | 'calendarPicker' | 'profile' | 'pin';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('household');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [householdId, setHouseholdId] = useState<string>('');

    // Household step state
    const [householdName, setHouseholdName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [hasInviteCode, setHasInviteCode] = useState(false);

    // Calendar step state
    const [calendarChoice, setCalendarChoice] = useState<'sync' | 'create' | null>(null);
    const [availableCalendars, setAvailableCalendars] = useState<CalendarItem[]>([]);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
    const [loadingCalendars, setLoadingCalendars] = useState(false);

    // Profile step state
    const [displayName, setDisplayName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0].hex);

    // PIN step state
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');

    // Load user data on mount
    useEffect(() => {
        const loadUserData = async () => {
            let retries = 0;
            const maxRetries = 3;

            while (retries < maxRetries) {
                try {
                    const token = localStorage.getItem('momentum_token');
                    if (!token) {
                        // Treat missing token as a temporary failure to retry
                        throw new Error('No token found');
                    }

                    const response = await fetch('/web-bff/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    const data = await response.json();

                    if (response.ok && data.status === 'success') {
                        setUser(data.data.user);
                        setHouseholdId(data.data.householdId || '');
                        setDisplayName(data.data.user.firstName || '');
                        return; // Success!
                    }

                    // If we get here, response was not ok
                    console.warn(`Load user attempt ${retries + 1} failed:`, data.message);

                    // Only retry if it's a 404 (Household not found) or 500 series
                    // If it's 401 (Unauthorized), the token is bad, so don't retry
                    if (response.status === 401) {
                        router.push('/login');
                        return;
                    }

                } catch (err: any) {
                    console.error(`Error loading user data (attempt ${retries + 1}):`, err);
                }

                retries++;
                if (retries < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
                }
            }

            // If we fall through here, all retries failed
            router.push('/login'); // Fail safe
        };

        loadUserData();
    }, [router]);

    const handleHouseholdSetup = () => {
        setError(null);

        if (hasInviteCode) {
            if (!inviteCode.trim()) {
                setError('Please enter an invite code');
                return;
            }
        } else {
            if (!householdName.trim()) {
                setError('Please enter a household name');
                return;
            }
        }

        setStep('calendar');
    };

    const handleCalendarChoice = async (choice: 'sync' | 'create') => {
        setCalendarChoice(choice);
        setError(null);

        if (choice === 'sync') {
            setLoadingCalendars(true);
            try {
                const token = localStorage.getItem('momentum_token');
                const response = await fetch('/web-bff/calendar/list', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok || data.status === 'fail' || data.status === 'error') {
                    setError(data.message || 'Failed to load calendars');
                    setLoadingCalendars(false);
                    return;
                }

                setAvailableCalendars(data.data.calendars || []);
                setStep('calendarPicker');
            } catch (err: any) {
                setError('Failed to load calendars');
                console.error('Calendar load error:', err);
            } finally {
                setLoadingCalendars(false);
            }
        } else {
            setStep('profile');
        }
    };

    const handleCalendarSelected = () => {
        if (!selectedCalendarId) {
            setError('Please select a calendar');
            return;
        }
        setStep('profile');
    };

    const handleProfileComplete = () => {
        if (!displayName.trim()) {
            setError('Please enter a display name');
            return;
        }
        setStep('pin');
    };

    const handlePINSetup = () => {
        setError(null);

        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        if (pin !== pinConfirm) {
            setError('PINs do not match');
            return;
        }

        handleComplete();
    };

    const handleComplete = async () => {
        if (!displayName.trim()) {
            setError('Please enter a display name');
            return;
        }

        if (!user?._id) {
            setError('User information is missing');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('momentum_token');
            const response = await fetch('/web-bff/auth/onboarding/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: user._id,
                    householdId: householdId,
                    householdName: hasInviteCode ? undefined : householdName.trim(),
                    inviteCode: hasInviteCode ? inviteCode.trim() : undefined,
                    displayName: displayName.trim(),
                    profileColor: selectedColor,
                    calendarChoice: calendarChoice || undefined,
                    selectedCalendarId: calendarChoice === 'sync' ? selectedCalendarId : undefined,
                    pin: pin,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                const message = data.message || 'Failed to complete onboarding';
                setError(message);
                setIsLoading(false);
                return;
            }

            router.push('/family');
        } catch (err: any) {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
                <Loader className="w-8 h-8 text-action-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-action-primary mb-2">
                        Welcome to Momentum!
                    </h1>
                    <p className="text-lg text-text-secondary">
                        Let's get you set up
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center mb-8">
                    <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full ${step === 'household' ? 'bg-action-primary' : 'bg-border-subtle'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${step === 'calendar' || step === 'calendarPicker' ? 'bg-action-primary' : 'bg-border-subtle'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${step === 'profile' ? 'bg-action-primary' : 'bg-border-subtle'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${step === 'pin' ? 'bg-action-primary' : 'bg-border-subtle'}`}></div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                        <AlertTriangle className="w-5 h-5 mr-3" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Content */}
                <div className="bg-bg-surface rounded-2xl shadow-lg p-8">
                    {step === 'household' && (
                        <HouseholdSetupStep
                            householdName={householdName}
                            setHouseholdName={setHouseholdName}
                            inviteCode={inviteCode}
                            setInviteCode={setInviteCode}
                            hasInviteCode={hasInviteCode}
                            setHasInviteCode={setHasInviteCode}
                            setError={setError}
                            onContinue={handleHouseholdSetup}
                        />
                    )}

                    {step === 'calendar' && (
                        <CalendarSetupStep
                            calendarChoice={calendarChoice}
                            loadingCalendars={loadingCalendars}
                            onChoice={handleCalendarChoice}
                            onBack={() => setStep('household')}
                        />
                    )}

                    {step === 'calendarPicker' && (
                        <CalendarPickerStep
                            availableCalendars={availableCalendars}
                            selectedCalendarId={selectedCalendarId}
                            setSelectedCalendarId={setSelectedCalendarId}
                            onBack={() => setStep('calendar')}
                            onContinue={handleCalendarSelected}
                        />
                    )}

                    {step === 'profile' && (
                        <ProfileSetupStep
                            displayName={displayName}
                            setDisplayName={setDisplayName}
                            selectedColor={selectedColor}
                            setSelectedColor={setSelectedColor}
                            calendarChoice={calendarChoice}
                            onBack={() => setStep(calendarChoice === 'sync' ? 'calendarPicker' : 'calendar')}
                            onContinue={handleProfileComplete}
                        />
                    )}

                    {step === 'pin' && (
                        <PINSetupStep
                            pin={pin}
                            setPin={setPin}
                            pinConfirm={pinConfirm}
                            setPinConfirm={setPinConfirm}
                            isLoading={isLoading}
                            onBack={() => setStep('profile')}
                            onComplete={handlePINSetup}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
