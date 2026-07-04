import React from 'react';
import { LayoutGrid, Coffee, Rocket } from 'lucide-react';

export type ParentViewType = 'bento' | 'briefing' | 'mission';

interface ParentViewSwitcherProps {
    currentView: ParentViewType;
    onViewChange: (view: ParentViewType) => void;
}

export default function ParentViewSwitcher({ currentView, onViewChange }: ParentViewSwitcherProps) {
    const views: { id: ParentViewType; label: string; icon: React.ElementType }[] = [
        { id: 'bento', label: 'Command Center', icon: LayoutGrid },
        { id: 'briefing', label: 'Morning Briefing', icon: Coffee },
        { id: 'mission', label: 'Mission Control', icon: Rocket },
    ];

    return (
        <div className="flex justify-center mb-8">
            <div className="bg-bg-surface p-1 rounded-xl border border-border-subtle shadow-sm flex space-x-1">
                {views.map((view) => (
                    <button
                        key={view.id}
                        onClick={() => onViewChange(view.id)}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${currentView === view.id
                                ? 'bg-action-primary text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-canvas'
                            }`}
                    >
                        <view.icon className={`w-4 h-4 ${currentView === view.id ? 'text-white' : ''}`} />
                        <span>{view.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
