// =========================================================
// momentum-web/app/components/layout/Loading.tsx
// Reusable Loading Component
// =========================================================
'use client';

import { Loader } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
            <div className="text-center">
                <Loader className="w-12 h-12 text-action-primary animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">Loading...</p>
            </div>
        </div>
    );
}
