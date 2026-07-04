// =========================================================
// momentum-web/app/components/focus/FocusModeView.tsx
// Web version of the mobile Focus Mode View
// Clean, ADHD-friendly single-task display.
// =========================================================
'use client';

import React, { useState } from 'react';
import { Target, CheckCircle, Bell, X, ArrowLeft } from 'lucide-react';
import { ITask } from '../../types';
import { useSession } from '../layout/SessionContext';

interface FocusModeViewProps {
    task: ITask;
    onComplete: () => void;
    onExit: () => void;
}

const FocusModeView: React.FC<FocusModeViewProps> = ({ task, onComplete, onExit }) => {
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = async () => {
        setIsCompleting(true);
        // Add artificial delay for satisfaction/animation if needed, 
        // but for now just call the prop which handles the API call
        await onComplete();
        setIsCompleting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-action-primary flex flex-col items-center justify-between text-white overflow-hidden">
            {/* Background Pattern/Gradient (Optional) */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

            {/* Header / Progress */}
            <div className="w-full max-w-2xl px-6 pt-12 pb-6 relative z-10 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8">
                    <button
                        onClick={onExit}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-semibold tracking-wide opacity-80">FOCUS MODE</span>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Simple Progress Bar (Single Task) */}
                <div className="w-full space-y-3">
                    <p className="text-center font-medium opacity-90">Task 1 of 1</p>
                    <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-full rounded-full" />
                        {/* Full width since it's the focus task */}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 max-w-3xl w-full text-center">
                <div className="mb-12 p-8 bg-white/10 rounded-full backdrop-blur-sm ring-4 ring-white/20">
                    <Target className="w-24 h-24 text-white" strokeWidth={1.5} />
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                    {task.title}
                </h1>

                {task.description && (
                    <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl leading-relaxed">
                        {task.description}
                    </p>
                )}

                <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    <span className="text-2xl font-bold">{task.pointsValue} Points</span>
                </div>
            </div>

            {/* Actions */}
            <div className="w-full max-w-md px-6 pb-12 relative z-10 space-y-4">
                <button
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="w-full flex items-center justify-center space-x-3 py-5 bg-signal-success hover:bg-signal-success/90 
                             text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] 
                             transition-all duration-200 font-bold text-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isCompleting ? (
                        <span>Completing...</span>
                    ) : (
                        <>
                            <CheckCircle className="w-8 h-8" />
                            <span>Done!</span>
                        </>
                    )}
                </button>

                <button
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-white/10 hover:bg-white/20 
                             text-white rounded-xl transition-colors font-medium"
                >
                    <Bell className="w-5 h-5" />
                    <span>Need Help?</span>
                </button>
            </div>
        </div>
    );
};

export default FocusModeView;
