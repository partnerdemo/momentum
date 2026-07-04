'use client';

import React, { useState, useEffect } from 'react';
import { IHouseholdMemberProfile } from '../../../types';
import { useSession } from '../../layout/SessionContext';

interface MemberScheduleColumnProps {
    member: IHouseholdMemberProfile;
    onHeaderClick: () => void;
}

const MemberScheduleColumn: React.FC<MemberScheduleColumnProps> = ({ member, onHeaderClick }) => {
    const { token } = useSession();
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const fetchMemberEvents = async () => {
            if (!token) return;
            try {
                // In a real app we'd filter by member ID on the backend or pass all events from parent
                // For this mock, we re-fetch all and filter locally by email
                const res = await fetch('/web-bff/calendar/google/events', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);

                    const memberEmail = member.familyMemberId.email; // Assuming populated
                    const myEvents = list.filter((e: any) =>
                        e.attendees?.some((a: any) => a.email === memberEmail)
                    );
                    setEvents(myEvents);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchMemberEvents();
    }, [token, member]);

    return (
        <div className="w-[200px] h-full flex flex-col border-r border-border-subtle shrink-0">
            {/* Header */}
            <button
                onClick={onHeaderClick}
                className="h-20 bg-white border-b border-border-subtle flex flex-col items-center justify-center hover:bg-bg-canvas transition-colors"
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm mb-1"
                    style={{ backgroundColor: member.profileColor || '#999' }}
                >
                    {member.displayName[0]}
                </div>
                <span className="font-bold text-sm text-text-primary">{member.displayName}</span>
            </button>

            {/* Events Pillar */}
            <div className="flex-1 bg-bg-canvas/30 overflow-y-auto p-2 space-y-2">
                {events.length === 0 ? (
                    <div className="text-center text-xs text-text-tertiary mt-10 italic">Free all day</div>
                ) : (
                    events.map((e: any) => (
                        <div key={e.id} className="bg-white rounded p-2 text-xs border border-border-subtle shadow-sm">
                            <div className="font-bold text-action-primary truncate">{e.summary || e.title}</div>
                            <div className="text-text-secondary scale-90 origin-left">
                                {new Date(e.start.dateTime || e.start.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MemberScheduleColumn;
