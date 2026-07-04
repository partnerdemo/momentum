import React from 'react';
import { Map, Star, CheckCircle, Clock, Compass, Repeat, Zap, Award, Pencil, Trash, User, Check } from 'lucide-react';
import {
    getQuestCardState,
    formatQuestPoints,
    type Quest,
    type QuestCardProps
} from 'momentum-shared';

// Extend props to include web-specific actions if needed, or stick to shared props
interface WebQuestCardProps extends QuestCardProps {
    questType?: 'one-time' | 'limited' | 'unlimited';
    recurrence?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    onApprove?: () => void;
    isParent?: boolean;
    isLoading?: boolean;
}

const QuestCard: React.FC<WebQuestCardProps> = ({
    quest,
    onPress,
    onClaim,
    onComplete,
    onEdit,
    onDelete,
    onApprove,
    isParent,
    isLoading,
    showActions = true
}) => {
    const {
        isAvailable,
        isActive,
        isCompleted,
        isPendingApproval,
        statusColor,
        statusLabel,
        actionLabel
    } = getQuestCardState(quest);

    // Helper for status badge style
    const getStatusBadgeStyle = () => {
        if (isAvailable) return "bg-action-primary/10 text-action-primary";
        if (isActive) return "bg-brand-secondary/10 text-brand-secondary";
        if (isPendingApproval) return "bg-signal-success/10 text-signal-success"; // Web uses success color for waiting approval?
        if (isCompleted) return "bg-text-tertiary/10 text-text-tertiary";
        return "bg-gray-100 text-gray-600";
    };

    return (
        <div className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-5 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${quest.status === 'Active' ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-action-primary/10 text-action-primary'}`}>
                            {/* Web uses specific icons for recurring/one-time, we can pass that in or derive it */}
                            {/* For now using generic icons based on status or type if available */}
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-medium text-text-primary line-clamp-1">{quest.title}</h3>
                            <div className="flex items-center text-xs text-text-secondary mt-0.5">
                                <Award className="w-3 h-3 mr-1 text-brand-secondary" />
                                <span className="font-semibold text-brand-secondary">{formatQuestPoints(quest.pointsValue)}</span>
                            </div>
                        </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadgeStyle()}`}>
                        {statusLabel}
                    </span>
                </div>

                <p className="text-sm text-text-secondary mb-4 line-clamp-2 min-h-[2.5rem]">
                    {quest.description || "No description provided."}
                </p>
            </div>

            <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                {/* Actions */}
                <div className="flex space-x-2 w-full">
                    {isParent && (
                        <>
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    disabled={isLoading}
                                    className="p-2 text-text-tertiary hover:text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors"
                                    title="Edit Quest"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    disabled={isLoading}
                                    className="p-2 text-text-tertiary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors"
                                    title="Delete Quest"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}

                    {/* Parent Approval Action */}
                    {isParent && isPendingApproval && onApprove && (
                        <button
                            onClick={onApprove}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-signal-success text-white text-sm font-medium rounded-lg hover:bg-signal-success/90 transition-colors"
                        >
                            <Check className="w-4 h-4 mr-1.5" /> Approve
                        </button>
                    )}

                    {/* Member Actions */}
                    {!isParent && isAvailable && onClaim && (
                        <button
                            onClick={onClaim}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-action-primary text-white text-sm font-medium rounded-lg hover:bg-action-hover transition-colors"
                        >
                            <User className="w-4 h-4 mr-1.5" /> {actionLabel}
                        </button>
                    )}

                    {!isParent && isActive && onComplete && (
                        <button
                            onClick={onComplete}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-signal-success text-white text-sm font-medium rounded-lg hover:bg-signal-success/90 transition-colors"
                        >
                            <Check className="w-4 h-4 mr-1.5" /> {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestCard;
