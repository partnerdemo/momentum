'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader, AlertTriangle, Check } from 'lucide-react';

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Signing in with Google...');
    const processedRef = useRef(false); // Prevent double execution in Strict Mode

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleCallback = async () => {
            if (processedRef.current) return;
            processedRef.current = true;

            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state'); // 'signin' or 'signup'
                const error = searchParams.get('error');

                if (error) {
                    setStatus('error');
                    setMessage('You denied access. Please try again.');
                    timeoutId = setTimeout(() => router.push(state === 'signup' ? '/signup' : '/login'), 3000);
                    return;
                }

                if (!code) {
                    setStatus('error');
                    setMessage('Invalid callback parameters');
                    timeoutId = setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                setMessage('Authenticating...');

                // Send authorization code to backend
                const response = await fetch('/web-bff/auth/google/authenticate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        redirectUri: `${window.location.origin}/auth/google/callback`,
                    }),
                });

                const data = await response.json();

                if (!response.ok || data.status === 'fail' || data.status === 'error') {
                    setStatus('error');
                    setMessage(data.message || 'Authentication failed');
                    timeoutId = setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                // Store token
                if (data.token) {
                    localStorage.setItem('momentum_token', data.token);
                    window.dispatchEvent(new Event('momentum_login'));
                }

                setStatus('success');
                setMessage('Successfully signed in!');

                // Check if user needs onboarding
                if (data.data?.needsOnboarding) {
                    timeoutId = setTimeout(() => router.push('/onboarding'), 1500);
                } else {
                    timeoutId = setTimeout(() => router.push('/family'), 1500);
                }

            } catch (err: any) {
                console.error('Callback error:', err);
                setStatus('error');
                setMessage('An error occurred. Please try again.');
                timeoutId = setTimeout(() => router.push('/login'), 3000);
            }
        };

        handleCallback();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-bg-surface rounded-2xl shadow-lg p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    {status === 'loading' && (
                        <>
                            <Loader className="w-12 h-12 text-action-primary animate-spin" />
                            <h2 className="text-2xl font-bold text-text-primary">
                                Signing In...
                            </h2>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-12 h-12 rounded-full bg-signal-success/20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-signal-success" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">
                                Success!
                            </h2>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-12 h-12 rounded-full bg-signal-alert/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-signal-alert" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary">
                                Error
                            </h2>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-bg-surface rounded-2xl shadow-lg p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Loader className="w-12 h-12 text-action-primary animate-spin" />
                        <h2 className="text-2xl font-bold text-text-primary">Loading callback...</h2>
                    </div>
                </div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}
