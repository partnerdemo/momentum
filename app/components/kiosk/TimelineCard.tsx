'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '../layout/SessionContext';
import { ICalendarEvent, IHouseholdMemberProfile } from '../../types';
import { Clock, MapPin, Loader, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { useFamilyData } from '../../../lib/hooks/useFamilyData';

// Helper to check if an event is "Now"
const isHappeningNow = (start: Date, end: Date) => {
    const now = new Date();
    return now >= start && now <= end;
};

// Helper to check if an event is "Past" (today but finished)
const isPast = (end: Date) => {
    return new Date() > end;
};

const TimelineCard: React.FC = () => {
    const { token } = useSession();
    const { members } = useFamilyData();
    const [events, setEvents] = useState<ICalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/web-bff/calendar/google/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load events');

            const data = await response.json();
            const eventList = data.data.events;

            // Local mapping
            const mappedEvents: ICalendarEvent[] = eventList.map((evt: any) => {
                // Ensure dates are valid
                const start = evt.start?.dateTime || evt.start?.date;
                const end = evt.end?.dateTime || evt.end?.date;
                return {
                    id: evt.id,
                    title: evt.summary || evt.title || 'Untitled Event',
                    startDate: start,
                    endDate: end,
                    allDay: !evt.start?.dateTime,
                    location: evt.location,
                    description: evt.description,
                    attendees: evt.attendees || [],
                    color: evt.colorId ? undefined : '#6366F1'
                };
            });
            console.log('[TimelineCard] Fetched events:', mappedEvents);

            // Filter for TODAY only (Robust check)
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

            const todaysEvents = mappedEvents.filter(e => {
                const evtStart = new Date(e.startDate).getTime();
                // Special handling for all-day events which might be at midnight UTC
                // However, new Date('YYYY-MM-DD') is usually UTC. 
                // We'll relax the check: if it overlaps with today's local range.
                // For simplicity: check if it starts within today's window OR is all day and strictly matches ISO date string

                if (e.allDay) {
                    // Check if ISO string YYYY-MM-DD matches local YYYY-MM-DD
                    // (Simplistic but often effective for single-day all-day events)
                    const localYMD = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
                    return e.startDate.startsWith(localYMD);
                }

                return evtStart >= startOfDay && evtStart < endOfDay;
            });

            console.log('[TimelineCard] Today\'s events:', todaysEvents);

            // Sort chronologically
            todaysEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

            setEvents(todaysEvents);
        } catch (err) {
            console.error('Timeline fetch error:', err);
            setError('Could not sync timeline');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // Refresh every 5 minutes to keep "Now" accurate and fetch new updates
        const interval = setInterval(fetchEvents, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [token]);

    // Helper to find member avatar by email
    const getMemberAvatar = (email: string) => {
        // This relies on parents having emails populated, or children having some link. 
        // For now, we match mainly on parent email or maybe name if possible, 
        // but strictly email is safer.
        const member = members.find(m => m.familyMemberId.email === email);
        return member;
    };

    // --- Render ---

    if (loading) {
        return (
            <div className="h-full bg-bg-surface rounded-3xl border border-border-subtle p-6 flex flex-col items-center justify-center shadow-lg">
                <Loader className="w-8 h-8 text-action-primary animate-spin mb-4" />
                <p className="text-text-secondary font-medium">Syncing Timeline...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full bg-bg-surface rounded-3xl border-2 border-signal-error/20 p-6 flex flex-col items-center justify-center shadow-lg">
                <AlertTriangle className="w-10 h-10 text-signal-error mb-4" />
                <p className="text-text-primary font-bold mb-2">Timeline Error</p>
                <p className="text-sm text-text-secondary text-center">{error}</p>
                <button
                    onClick={fetchEvents}
                    className="mt-4 text-action-primary font-bold hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-bg-surface rounded-3xl border border-border-subtle shadow-xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-bg-surface to-bg-canvas border-b border-border-subtle flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary tracking-tight">Timeline</h2>
                    <p className="text-text-secondary font-medium">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="p-3 bg-action-primary/10 rounded-2xl">
                    <CalendarIcon className="w-6 h-6 text-action-primary" />
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-16 h-16 bg-bg-canvas rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-border-subtle">
                            <Clock className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-lg font-medium text-text-primary">No events for today</p>
                        <p className="text-sm text-text-secondary">Enjoy your free time!</p>
                    </div>
                ) : (
                    events.map((event) => {
                        const start = new Date(event.startDate);
                        const end = new Date(event.endDate);
                        const happening = isHappeningNow(start, end);
                        const past = isPast(end);

                        return (
                            <div
                                key={event.id}
                                className={`
                                    relative p-4 rounded-2xl border transition-all duration-300
                                    ${happening
                                        ? 'bg-white border-action-primary shadow-lg scale-[1.02] ring-2 ring-action-primary/20 z-10'
                                        : past
                                            ? 'bg-bg-canvas/50 border-transparent opacity-60 grayscale-[0.5]'
                                            : 'bg-white border-border-subtle hover:border-action-primary/50 hover:shadow-md'
                                    }
                                `}
                            >
                                {happening && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-action-primary text-white text-xs font-bold rounded-full animate-pulse">
                                        <span className="w-2 h-2 bg-white rounded-full" />
                                        NOW
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    {/* Time Column */}
                                    <div className="flex flex-col items-center min-w-[60px]">
                                        <span className={`text-sm font-bold ${happening ? 'text-action-primary' : 'text-text-primary'}`}>
                                            {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        {!event.allDay && (
                                            <div className="h-full w-0.5 bg-border-subtle my-1 rounded-full" />
                                        )}
                                        {!event.allDay && (
                                            <span className="text-xs text-text-secondary">
                                                {end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-lg leading-tight mb-1 truncate ${happening ? 'text-action-primary' : 'text-text-primary'}`}>
                                            {event.title}
                                        </h3>

                                        {event.location && (
                                            <div className="flex items-center text-xs text-text-secondary mb-3">
                                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        )}

                                        {/* Attendees / Description */}
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {event.attendees && event.attendees.map((att, i) => {
                                                    const member = getMemberAvatar(att.email);
                                                    if (i > 4) return null; // Limit dots
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="w-8 h-8 rounded-full border-2 border-white bg-bg-canvas flex items-center justify-center text-xs font-bold text-text-secondary shadow-sm"
                                                            title={att.displayName || att.email}
                                                            style={{ backgroundColor: member?.profileColor || '#E5E7EB', color: member?.profileColor ? '#FFF' : undefined }}
                                                        >
                                                            {member
                                                                ? (member.role === 'Parent' ? 'P' : member.displayName[0])
                                                                : (att.displayName?.[0] || att.email[0]).toUpperCase()
                                                            }
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TimelineCard;
