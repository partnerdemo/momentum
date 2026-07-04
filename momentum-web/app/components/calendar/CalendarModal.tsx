'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Loader, AlertTriangle, RefreshCw } from 'lucide-react';
import Modal from '../shared/Modal';
import { useSession } from '../layout/SessionContext';

interface CalendarEvent {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    location?: string;
    description?: string;
    color?: string;
}

interface CalendarModalProps {
    onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ onClose }) => {
    const { token } = useSession();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            // Note: This endpoint needs to be proxied in web-bff
            const response = await fetch('/web-bff/calendar/google/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // If 404, it might mean the endpoint isn't ready or user not connected
                if (response.status === 404) {
                    throw new Error('Calendar service not available.');
                }
                throw new Error('Failed to fetch calendar events.');
            }

            const data = await response.json();
            // Handle different response structures based on API
            const eventList = Array.isArray(data) ? data : (data.data || []);

            // Map to local interface if needed
            const mappedEvents = eventList.map((evt: any) => ({
                id: evt.id,
                title: evt.summary || evt.title || 'No Title',
                startDate: evt.start?.dateTime || evt.start?.date,
                endDate: evt.end?.dateTime || evt.end?.date,
                allDay: !evt.start?.dateTime,
                location: evt.location,
                description: evt.description,
                color: '#4285F4' // Default Google Blue
            }));

            setEvents(mappedEvents);
        } catch (err: any) {
            console.error('Calendar fetch error:', err);
            setError(err.message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Family Calendar">
            <div className="space-y-4 min-h-[400px]">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-text-secondary">Upcoming events from Google Calendar</p>
                    <button
                        onClick={fetchEvents}
                        className="p-2 text-text-secondary hover:text-action-primary transition-colors"
                        title="Refresh Events"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader className="w-8 h-8 text-action-primary animate-spin mb-2" />
                        <p className="text-text-secondary">Loading events...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <AlertTriangle className="w-10 h-10 text-signal-alert mb-2" />
                        <p className="text-text-primary font-medium">Unable to load calendar</p>
                        <p className="text-sm text-text-secondary mt-1">{error}</p>
                        <button
                            onClick={fetchEvents}
                            className="mt-4 px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover"
                        >
                            Try Again
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <CalendarIcon className="w-12 h-12 text-border-subtle mb-3" />
                        <p className="text-text-primary font-medium">No upcoming events</p>
                        <p className="text-sm text-text-secondary">Your calendar is clear for now.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {events.map(event => (
                            <div key={event.id} className="flex bg-bg-surface border border-border-subtle rounded-lg p-3 hover:border-action-primary transition-colors">
                                {/* Date Box */}
                                <div className="flex flex-col items-center justify-center w-16 bg-bg-canvas rounded-md mr-4 border border-border-subtle">
                                    <span className="text-xs text-text-secondary uppercase font-bold">
                                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold text-text-primary">
                                        {new Date(event.startDate).getDate()}
                                    </span>
                                </div>

                                {/* Event Details */}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-text-primary">{event.title}</h3>
                                    <div className="flex items-center text-sm text-text-secondary mt-1 space-x-3">
                                        <div className="flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {event.allDay ? 'All Day' : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                <span className="truncate max-w-[150px]">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default CalendarModal;
