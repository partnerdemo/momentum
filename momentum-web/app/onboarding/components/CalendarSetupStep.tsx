import React from 'react';
import { Calendar, Plus, Loader } from 'lucide-react';

interface CalendarSetupStepProps {
    calendarChoice: 'sync' | 'create' | null;
    loadingCalendars: boolean;
    onChoice: (choice: 'sync' | 'create') => void;
    onBack: () => void;
}

export default function CalendarSetupStep({
    calendarChoice,
    loadingCalendars,
    onChoice,
    onBack,
}: CalendarSetupStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Calendar Setup
                </h2>
                <p className="text-text-secondary">
                    How would you like to manage your family calendar?
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={() => onChoice('sync')}
                    disabled={loadingCalendars}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${calendarChoice === 'sync'
                            ? 'border-action-primary bg-action-primary/5'
                            : 'border-border-subtle hover:border-action-primary/50'
                        } ${loadingCalendars ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loadingCalendars ? (
                        <Loader className="w-8 h-8 text-action-primary mx-auto mb-3 animate-spin" />
                    ) : (
                        <Calendar className="w-8 h-8 text-action-primary mx-auto mb-3" />
                    )}
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Sync Existing Calendar
                    </h3>
                    <p className="text-sm text-text-secondary">
                        Connect your existing Google Calendar
                    </p>
                </button>

                <button
                    onClick={() => onChoice('create')}
                    disabled={loadingCalendars}
                    className={`w-full p-6 rounded-xl border-2 transition-all ${calendarChoice === 'create'
                            ? 'border-action-primary bg-action-primary/5'
                            : 'border-border-subtle hover:border-action-primary/50'
                        } ${loadingCalendars ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Plus className="w-8 h-8 text-action-primary mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Create New Calendar
                    </h3>
                    <p className="text-sm text-text-secondary">
                        We'll create a new "Momentum Family Calendar" for you
                    </p>
                </button>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
                >
                    Back
                </button>
            </div>
        </div>
    );
}
