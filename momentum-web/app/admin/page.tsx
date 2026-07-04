// =========================================================
// momentum-web/app/admin/page.tsx
// Consolidated Parent View - Command Center, Briefing, Mission
// =========================================================
'use client';

import React, { useState } from 'react';
import { useSession } from '../components/layout/SessionContext';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import Loading from '../components/layout/Loading';
import BentoDashboard from '../components/admin/BentoDashboard';
import ParentViewSwitcher, { ParentViewType } from '../components/admin/ParentViewSwitcher';
import MorningBriefing from '../components/admin/views/MorningBriefing';
import MissionControl from '../components/admin/views/MissionControl';

export default function AdminPage() {
    const { user } = useSession();
    const router = useRouter();
    const [currentView, setCurrentView] = useState<ParentViewType>('bento');

    // Role-based access control
    if (!user) {
        return <Loading />;
    }

    if (user.role !== 'Parent') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-canvas p-8">
                <div className="bg-bg-surface p-8 rounded-2xl shadow-xl border border-border-subtle max-w-md text-center">
                    <Shield className="w-16 h-16 text-signal-alert mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-text-primary mb-2">Access Restricted</h1>
                    <p className="text-text-secondary mb-6">
                        The Command Center is restricted to Parent accounts only.
                    </p>
                    <button
                        onClick={() => router.push('/family')}
                        className="w-full py-3 bg-action-primary text-white rounded-lg font-medium hover:bg-action-hover"
                    >
                        Return to Family View
                    </button>
                </div>
            </div>
        );
    }

    // Render the active view
    const renderActiveView = () => {
        switch (currentView) {
            case 'briefing':
                return <MorningBriefing />;
            case 'mission':
                return <MissionControl />;
            case 'bento':
            default:
                return <BentoDashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-bg-canvas">
            {/* Header / Navbar */}
            <header className="bg-bg-surface border-b border-border-subtle px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-md">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="h-6 w-px bg-border-subtle" />
                        <h1 className="text-xl font-bold text-text-primary">
                            Command Center
                        </h1>
                    </div>
                </div>
                <div className="text-sm text-text-secondary">
                    Logged in as {user.firstName}
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="py-6">
                <ParentViewSwitcher
                    currentView={currentView}
                    onViewChange={setCurrentView}
                />

                {renderActiveView()}
            </div>
        </div>
    );
}
