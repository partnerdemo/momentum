import React from 'react';
import { Check } from 'lucide-react';

interface CalendarItem {
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
}

interface CalendarPickerStepProps {
    availableCalendars: CalendarItem[];
    selectedCalendarId: string;
    setSelectedCalendarId: (id: string) => void;
    onBack: () => void;
    onContinue: () => void;
}

export default function CalendarPickerStep({
    availableCalendars,
    selectedCalendarId,
    setSelectedCalendarId,
    onBack,
    onContinue,
}: CalendarPickerStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Select a Calendar
                </h2>
                <p className="text-text-secondary">
                    Choose which calendar to sync with Momentum
                </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableCalendars.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">
                        No calendars found
                    </p>
                ) : (
                    availableCalendars.map((calendar) => (
                        <button
                            key={calendar.id}
                            onClick={() => setSelectedCalendarId(calendar.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedCalendarId === calendar.id
                                    ? 'border-action-primary bg-action-primary/5'
                                    : 'border-border-subtle hover:border-action-primary/50'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text-primary">
                                        {calendar.summary}
                                        {calendar.primary && (
                                            <span className="ml-2 text-xs text-action-primary">(Primary)</span>
                                        )}
                                    </h3>
                                    {calendar.description && (
                                        <p className="text-sm text-text-secondary mt-1">
                                            {calendar.description}
                                        </p>
                                    )}
                                </div>
                                {selectedCalendarId === calendar.id && (
                                    <Check className="w-5 h-5 text-action-primary flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    ))
                )}
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
                    disabled={!selectedCalendarId}
                    className={`flex-1 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm text-white transition-all duration-200 ${!selectedCalendarId
                            ? 'bg-action-primary/60 cursor-not-allowed'
                            : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'
                        }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
