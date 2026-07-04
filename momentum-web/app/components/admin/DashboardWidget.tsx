import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardWidgetProps {
    title: string;
    value?: string | number;
    subtext?: string;
    icon: LucideIcon;
    onClick?: () => void;
    color?: string; // Tailwind text color class, e.g., 'text-indigo-600'
    className?: string; // For grid spanning, e.g., 'col-span-2'
    bgColor?: string; // Tailwind bg color class
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
    title,
    value,
    subtext,
    icon: Icon,
    onClick,
    color = 'text-action-primary',
    className = '',
    bgColor = 'bg-bg-surface'
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                ${bgColor} ${className}
                border border-border-subtle rounded-2xl p-6 shadow-sm
                hover:shadow-md hover:border-action-primary/30 transition-all duration-200
                flex flex-col justify-between group
                min-h-[160px] text-left w-full
                cursor-pointer
            `}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-bg-canvas group-hover:bg-white transition-colors`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                {/* Optional: Arrow or indicator */}
            </div>

            <div>
                <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
                {value !== undefined && (
                    <div className="text-3xl font-bold text-text-primary mb-1">
                        {value}
                    </div>
                )}
                {subtext && (
                    <p className="text-text-secondary text-xs">{subtext}</p>
                )}
            </div>
        </button>
    );
};

export default DashboardWidget;
