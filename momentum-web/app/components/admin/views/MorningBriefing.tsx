import React, { useState } from 'react';
import { useSession } from '../../../components/layout/SessionContext';
import { useFamilyData } from '../../../../lib/hooks/useFamilyData';
import {
    CloudSun,
    Coffee,
    Calendar as CalendarIcon,
    Utensils,
    AlertCircle,
    Check,
    Clock,
    Sun,
    Map
} from 'lucide-react';
import { format } from 'date-fns';

export default function MorningBriefing() {
    const { user } = useSession();
    const { members, tasks, mealPlans, routines } = useFamilyData();
    const [greeting] = useState(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    });

    // --- Derived Data ---
    const today = new Date();
    const formattedDate = format(today, 'EEEE, MMMM do');

    // Approvals (The Overnight Wire)
    const pendingApprovals = tasks.filter(t => t.status === 'PendingApproval');

    // Today's Routines (The Forecast)
    const sortedRoutines = [...routines]
        .filter(r => {
            const member = members.find(m => m._id === r.memberId);
            return member && member.role !== 'Parent';
        })
        .sort((a, b) => { // Sort by time of day
            const order = { 'morning': 0, 'noon': 1, 'night': 2 };
            return (order[a.timeOfDay as keyof typeof order] || 0) - (order[b.timeOfDay as keyof typeof order] || 0);
        });

    // Today's Dinner
    const todayStr = today.toISOString().split('T')[0];
    const todaysDinner = mealPlans
        .flatMap(p => p.meals)
        .find(m => {
            const dateStr = typeof m.date === 'string' ? m.date : m.date.toISOString();
            return dateStr.startsWith(todayStr) && m.mealType === 'Dinner';
        });

    const todaysDinnerName = todaysDinner?.itemId?.name || todaysDinner?.customTitle || 'Not planned yet';

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-in fade-in duration-500">

            {/* --- Header Section --- */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full mb-4">
                    <CloudSun className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold text-text-primary mb-2">
                    {greeting}, {user?.firstName || 'Parent'}
                </h1>
                <p className="text-lg text-text-secondary font-medium">
                    {formattedDate} • The Daily Briefing
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- Left Column: The Wire (Action Items) --- */}
                <div className="space-y-8">
                    {/* The Overnight Wire (Approvals) */}
                    <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border-subtle bg-bg-canvas/50">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                    <Coffee className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">The Overnight Wire</h2>
                                    <p className="text-sm text-text-secondary">Pending items needing attention</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {pendingApprovals.length > 0 ? (
                                <div className="space-y-4">
                                    {pendingApprovals.map(task => {
                                        const member = members.find(m => m._id === task.completedBy || m.familyMemberId?._id === task.completedBy);
                                        const completedByName = member ? (member.displayName || member.familyMemberId?.firstName) : 'Someone';
                                        return (
                                            <div key={task._id} className="flex items-center justify-between p-4 bg-bg-canvas rounded-xl border border-border-subtle">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 rounded-full bg-signal-alert" />
                                                    <div>
                                                        <p className="font-medium text-text-primary">{task.title}</p>
                                                        <p className="text-xs text-text-secondary">
                                                            Completed by {completedByName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-action-primary/10 text-action-primary hover:bg-action-primary hover:text-white rounded-lg text-sm font-medium transition-colors">
                                                    Review
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="inline-flex justify-center items-center w-12 h-12 bg-signal-success/10 text-signal-success rounded-full mb-3">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <p className="text-text-primary font-medium">All Caught Up!</p>
                                    <p className="text-sm text-text-secondary">No pending approvals right now.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats or Concierge Placeholder */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Concierge Services</h3>
                            <p className="text-indigo-100 mb-6 max-w-md">
                                Need to adjust the simulation parameters? manage settings, themes, and household profiles.
                            </p>
                            <button className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
                                Open Settings
                            </button>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
                            <Map className="w-64 h-64" />
                        </div>
                    </div>
                </div>

                {/* --- Right Column: The Forecast (Schedule) --- */}
                <div className="space-y-8">
                    {/* The Forecast */}
                    <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden h-full">
                        <div className="p-6 border-b border-border-subtle bg-bg-canvas/50">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">The Forecast</h2>
                                    <p className="text-sm text-text-secondary">Today's schedule & meals</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Dinner Plan */}
                            <div className="flex items-start space-x-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                <div className="p-2 bg-orange-100 dark:bg-orange-800 text-orange-600 rounded-lg">
                                    <Utensils className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Tonight's Dinner</p>
                                    <p className="text-lg font-bold text-text-primary mt-1">{todaysDinnerName}</p>
                                </div>
                            </div>

                            {/* Routine Timeline */}
                            <div className="relative pl-4 border-l-2 border-border-subtle space-y-8 py-2">
                                {sortedRoutines.map((routine, index) => {
                                    const assignedMember = members.find(m => m._id === routine.memberId);
                                    return (
                                        <div key={routine._id} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-bg-surface border-2 border-action-primary" />
                                            <div>
                                                <p className="text-xs font-bold text-action-primary uppercase mb-1 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {routine.timeOfDay} Routine
                                                </p>
                                                <p className="text-base font-medium text-text-primary">{routine.title}</p>
                                                <p className="text-sm text-text-secondary mt-1">
                                                    Assigned to: {assignedMember?.displayName || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {sortedRoutines.length === 0 && (
                                    <div className="text-center text-text-secondary py-4">
                                        No active routines scheduled for today.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
