'use client';

import React, { useEffect, useRef } from 'react';

interface GoogleSignInButtonProps {
    onSuccess: (credential: string) => void;
    onError?: () => void;
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                    disableAutoSelect: () => void;
                };
            };
        };
    }
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    onSuccess,
    onError,
    text = 'signin_with'
}) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (!clientId) {
            console.error('Google Client ID not configured');
            return;
        }

        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google && buttonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (response: any) => {
                        if (response.credential) {
                            onSuccess(response.credential);
                        } else {
                            onError?.();
                        }
                    },
                    // Disable auto-select to force account picker
                    auto_select: false,
                    // Cancel the One Tap prompt
                    cancel_on_tap_outside: false,
                });

                window.google.accounts.id.renderButton(
                    buttonRef.current,
                    {
                        theme: 'outline',
                        size: 'large',
                        text: text,
                        width: '100%',
                        logo_alignment: 'left',
                    }
                );

                // Disable auto-select and force account picker
                window.google.accounts.id.disableAutoSelect();
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [clientId, onSuccess, onError, text]);

    if (!clientId) {
        return (
            <div className="p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30 text-sm">
                Google Sign-In is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.
            </div>
        );
    }

    return (
        <div className="w-full">
            <div ref={buttonRef} className="w-full flex justify-center" />
        </div>
    );
};

export default GoogleSignInButton;
