'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '../../layout/SessionContext';
import { ICalendarEvent } from '../../../types';
import { Loader } from 'lucide-react';

const HorizontalTimeline: React.FC = () => {
    const { token } = useSession();
    const [events, setEvents] = useState<ICalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch('/web-bff/calendar/google/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const eventList = Array.isArray(data) ? data : (data.data || []);

                // Map and Filter for Today
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

                const mapped = eventList.map((e: any) => ({
                    id: e.id,
                    title: e.summary || e.title || 'Untitled',
                    startDate: e.start?.dateTime || e.start?.date,
                    endDate: e.end?.dateTime || e.end?.date,
                    allDay: !e.start?.dateTime,
                    color: '#6366F1' // Default color
                })).filter((e: ICalendarEvent) => {
                    const t = new Date(e.startDate).getTime();
                    return t >= startOfDay && t < endOfDay;
                }).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

                setEvents(mapped);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, [token]);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader className="animate-spin text-action-primary" /></div>;

    // Time calculations
    const now = new Date();
    const startHour = 6; // 6 AM
    const totalHours = 16; // until 10 PM

    const getPosition = (dateStr: string) => {
        const d = new Date(dateStr);
        const hours = d.getHours() + d.getMinutes() / 60;
        const offset = hours - startHour;
        return Math.max(0, (offset / totalHours) * 100);
    };

    const getDurationWidth = (start: string, end: string) => {
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const hours = (e - s) / (1000 * 60 * 60);
        return (hours / totalHours) * 100;
    };

    return (
        <div className="h-full bg-white rounded-2xl border border-border-subtle p-4 overflow-x-auto relative shadow-sm">
            <div className="min-w-[1200px] h-full relative">
                {/* Time Markers */}
                {Array.from({ length: totalHours + 1 }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-border-subtle text-xs text-text-tertiary pl-1" style={{ left: `${(i / totalHours) * 100}%` }}>
                        {(startHour + i) > 12 ? (startHour + i - 12) + 'PM' : (startHour + i) + 'AM'}
                    </div>
                ))}

                {/* Current Time Line */}
                <div className="absolute top-0 bottom-0 border-l-2 border-signal-error z-20"
                    style={{ left: `${getPosition(now.toISOString())}%` }}
                >
                    <div className="absolute -top-1 -ml-1.5 w-3 h-3 bg-signal-error rounded-full" />
                </div>

                {/* Events */}
                <div className="absolute top-8 bottom-0 w-full">
                    {events.map((evt, idx) => (
                        <div
                            key={evt.id}
                            className="absolute h-24 rounded-lg bg-action-primary/20 border-l-4 border-action-primary p-2 text-xs overflow-hidden hover:z-30 hover:shadow-lg transition-all"
                            style={{
                                left: `${getPosition(evt.startDate)}%`,
                                width: `${Math.max(2, getDurationWidth(evt.startDate, evt.endDate))}%`,
                                top: `${(idx % 3) * 30}%` // Stagger overlapping events roughly
                            }}
                            title={`${evt.title} (${new Date(evt.startDate).toLocaleTimeString()})`}
                        >
                            <strong className="block truncate text-action-primary">{evt.title}</strong>
                            <span className="opacity-75">{new Date(evt.startDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HorizontalTimeline;
