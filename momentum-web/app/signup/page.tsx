// =========================================================
// silkpanda/momentum-web/app/signup/page.tsx
// Sign-Up Route Wrapper
// =========================================================
import SignUpForm from '../components/auth/SignUpForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * @fileoverview Page wrapper for the Parent Sign-Up form.
 * @component SignUpPage
 */
export default function SignUpPage() {
    return (
        // Uses the mandated canvas background color
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas p-4 sm:p-8">

            {/* Back to Home Link */}
            <div className="w-full max-w-lg mb-4">
                <Link
                    href="/"
                    className="text-text-secondary hover:text-action-primary flex items-center text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Home
                </Link>
            </div>

            {/* Main Content Card (The "Surface" element) */}
            {/* Uses mandated card styling: bg-bg-surface, shadow, rounded-xl, border */}
            <div className="w-full max-w-lg p-8 sm:p-10 bg-bg-surface rounded-xl shadow-xl border border-border-subtle">
                <SignUpForm />
            </div>

        </div>
    );
}