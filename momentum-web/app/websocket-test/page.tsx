// app/websocket-test/page.tsx
// WebSocket Testing Page - For Development Only
'use client';

import { useState, useEffect } from 'react';
import { useSocket, useSocketEvent, useSocketStatus, useSocketEmit } from '../../lib/hooks/useSocket';
import { SOCKET_EVENTS } from '../../lib/socket';

export default function WebSocketTestPage() {
    const socket = useSocket();
    const isConnected = useSocketStatus();
    const emit = useSocketEmit();

    const [events, setEvents] = useState<Array<{ time: string; event: string; data: any }>>([]);
    const [testMessage, setTestMessage] = useState('');

    // Listen to all events for testing
    useSocketEvent(SOCKET_EVENTS.TASK_UPDATED, (data) => {
        addEvent('task_updated', data);
    });

    useSocketEvent(SOCKET_EVENTS.QUEST_UPDATED, (data) => {
        addEvent('quest_updated', data);
    });

    useSocketEvent(SOCKET_EVENTS.ROUTINE_UPDATED, (data) => {
        addEvent('routine_updated', data);
    });

    useSocketEvent(SOCKET_EVENTS.MEMBER_POINTS_UPDATED, (data) => {
        addEvent('member_points_updated', data);
    });

    const addEvent = (eventName: string, data: any) => {
        const time = new Date().toLocaleTimeString();
        setEvents(prev => [{ time, event: eventName, data }, ...prev].slice(0, 50)); // Keep last 50 events
    };

    const handleSendTest = () => {
        if (testMessage.trim()) {
            emit('test_event', { message: testMessage });
            setTestMessage('');
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    return (
        <div className="min-h-screen bg-bg-canvas p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-text-primary mb-2">
                        WebSocket Test Page
                    </h1>
                    <p className="text-text-secondary">
                        Monitor real-time WebSocket events and test connectivity
                    </p>
                </div>

                {/* Connection Status */}
                <div className="bg-bg-surface rounded-lg border border-border-subtle p-6 mb-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Connection Status</h2>
                    <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-text-primary font-medium">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                        {socket && (
                            <span className="text-text-secondary text-sm">
                                Socket ID: {socket.id || 'N/A'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Send Test Event */}
                <div className="bg-bg-surface rounded-lg border border-border-subtle p-6 mb-6">
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Send Test Event</h2>
                    <div className="flex space-x-4">
                        <input
                            type="text"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendTest()}
                            placeholder="Enter test message..."
                            className="flex-1 px-4 py-2 bg-bg-canvas border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
                        />
                        <button
                            onClick={handleSendTest}
                            disabled={!isConnected || !testMessage.trim()}
                            className="px-6 py-2 bg-action-primary text-white rounded-lg font-medium hover:bg-action-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </div>

                {/* Event Log */}
                <div className="bg-bg-surface rounded-lg border border-border-subtle p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-text-primary">
                            Event Log ({events.length})
                        </h2>
                        <button
                            onClick={clearEvents}
                            className="px-4 py-2 text-sm bg-bg-canvas text-text-secondary rounded-lg hover:bg-border-subtle transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    {events.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            <p>No events received yet.</p>
                            <p className="text-sm mt-2">Try creating, updating, or deleting a task in another tab.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {events.map((event, index) => (
                                <div
                                    key={index}
                                    className="bg-bg-canvas rounded-lg p-4 border border-border-subtle"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm text-action-primary font-medium">
                                            {event.event}
                                        </span>
                                        <span className="text-xs text-text-secondary">
                                            {event.time}
                                        </span>
                                    </div>
                                    <pre className="text-xs text-text-secondary overflow-x-auto">
                                        {JSON.stringify(event.data, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        How to Test
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <li>• Open this page in one tab</li>
                        <li>• Open the family dashboard or admin panel in another tab</li>
                        <li>• Create, update, or delete tasks, quests, or routines</li>
                        <li>• Watch the events appear in real-time on this page</li>
                        <li>• Check that the connection status shows "Connected"</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
