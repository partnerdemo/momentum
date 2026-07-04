'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '../../layout/SessionContext';
import { Loader } from 'lucide-react';

const PulseHero: React.FC = () => {
    const { token } = useSession();
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [status, setStatus] = useState<'free' | 'busy'>('free');
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        if (!token) return;
        try {
            const response = await fetch('/web-bff/calendar/google/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const eventList = Array.isArray(data) ? data : (data.data || []);
                const now = new Date().getTime();

                // Find currently happening event
                const active = eventList.find((e: any) => {
                    const start = new Date(e.start?.dateTime || e.start?.date).getTime();
                    const end = new Date(e.end?.dateTime || e.end?.date).getTime();
                    return now >= start && now < end;
                });

                if (active) {
                    setCurrentEvent(active);
                    setStatus('busy');
                } else {
                    // Find next event
                    const next = eventList
                        .map((e: any) => ({ ...e, startTime: new Date(e.start?.dateTime || e.start?.date).getTime() }))
                        .filter((e: any) => e.startTime > now)
                        .sort((a: any, b: any) => a.startTime - b.startTime)[0];

                    setCurrentEvent(next || null);
                    setStatus('free');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStatus(); }, [token]);

    if (loading) return <Loader className="animate-spin" />;

    return (
        <div className="flex flex-col items-center justify-center p-10 text-center relative z-10">
            <div className={`
                w-96 h-96 rounded-full flex flex-col items-center justify-center
                transition-all duration-1000 relative
                ${status === 'busy' ? 'bg-action-primary text-white shadow-[0_0_60px_rgba(99,102,241,0.6)]' : 'bg-white border-8 border-bg-canvas text-text-primary shadow-xl'}
            `}>
                {status === 'busy' && (
                    <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping opacity-20"></div>
                )}

                {status === 'busy' ? (
                    <>
                        <span className="text-xl font-medium opacity-80 uppercase tracking-widest mb-2">Happening Now</span>
                        <h1 className="text-4xl font-bold leading-tight px-8 line-clamp-3">
                            {currentEvent?.summary || currentEvent?.title || 'Busy'}
                        </h1>
                        <p className="mt-4 text-lg opacity-90">
                            Ends at {new Date(currentEvent?.end.dateTime || currentEvent?.end.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </>
                ) : (
                    <>
                        <span className="text-2xl font-bold text-signal-success mb-4">Free Time</span>
                        {currentEvent && (
                            <p className="text-text-secondary text-lg px-8">
                                Up Next: <strong>{currentEvent.summary || currentEvent.title}</strong>
                                <br /> at {new Date(currentEvent.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                        )}
                        {!currentEvent && <p className="text-text-secondary">No more events today!</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default PulseHero;
