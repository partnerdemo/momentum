// =========================================================
// momentum-web/app/family/page.tsx
// Family View - The Primary Interface (Kiosk Mode)
// =========================================================
'use client';

import { Suspense } from 'react';
import { useSession } from '../components/layout/SessionContext';
import { useRouter } from 'next/navigation';
import KioskDashboard from '../components/kiosk/KioskDashboard';
import Loading from '../components/layout/Loading';

/**
 * Family View - The main interface for daily family interaction
 * This is the default view after login for ALL users
 */
export default function FamilyPage() {
    const { user, isLoading } = useSession();
    const router = useRouter();

    // Redirect if not authenticated
    if (!isLoading && !user) {
        router.push('/login');
        return <Loading />;
    }

    if (isLoading || !user) {
        return <Loading />;
    }

    return (
        <div className="bg-bg-canvas text-text-primary selection:bg-action-primary/20 min-h-screen">
            <main className="max-w-[2560px] mx-auto min-h-screen p-12 overflow-x-hidden">
                <Suspense fallback={<Loading />}>
                    <KioskDashboard />
                </Suspense>
            </main>
        </div>
    );
}