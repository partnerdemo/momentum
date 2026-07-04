// =========================================================
// silkpanda/momentum/app/components/layout/CollapsibleSection.tsx
// New reusable component to consolidate duplicated logic
// from MemberList and TaskList.
// =========================================================
'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
    Icon: React.ElementType;
    title: string;
    count: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
    emptyMessage?: string; // Optional message for when count is 0
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    Icon, title, count, children, defaultOpen = false, emptyMessage = "No items in this section."
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-bg-surface rounded-lg shadow-md border border-border-subtle">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4"
            >
                <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-action-primary" />
                    <h3 className="text-lg font-medium text-text-primary">{title}</h3>
                    <span className="text-sm text-text-secondary">({count})</span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border-subtle">
                    {count > 0 ? (
                        <ul className="space-y-4">{children}</ul>
                    ) : (
                        <p className="text-sm text-text-secondary text-center">{emptyMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;