// =========================================================
// silkpanda/momentum-web/components/auth/LoginForm.tsx
// Parent Login Form Component (Phase 2.1)
//
// [FIX] Moved FormInput component definition outside
// LoginForm to prevent re-rendering and focus loss.
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Removed local FormInput definition
// and now import the centralized ../layout/FormInput.tsx.
// =========================================================
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, AlertTriangle, Loader, CheckCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormInput from '../layout/FormInput'; // TELA CODICIS: Import centralized component
import GoogleOAuthButton from './GoogleOAuthButton';

// Interface for the form state
// [FIX] Moved outside component to be accessible by FormInput
interface FormState {
    email: string;
    password: string;
}

// TELA CODICIS: Removed local FormInput definition.
// The component is now imported from ../layout/FormInput.tsx

const LoginForm: React.FC = () => {
    const [formData, setFormData] = useState<FormState>({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Basic client-side validation
        if (!formData.email || !formData.password) {
            setError('Please enter both email and password.');
            setIsLoading(false);
            return;
        }

        try {
            // REFACTORED (v4): Call the Embedded Web BFF endpoint
            const response = await fetch('/web-bff/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            // FIX: Safely parse JSON data, handling potential empty/non-JSON responses.
            const text = await response.text();
            let data;

            if (text) {
                // Attempt to parse text as JSON
                data = JSON.parse(text);
            } else {
                // If text is empty, create a default error structure for the logic below
                data = { status: 'error', message: 'Received empty response from server.' };
            }


            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                // Handle API errors (e.g., 401 Unauthorized for incorrect credentials)
                const message = data.message || 'Login failed. Please check your credentials.';
                setError(message);
                setIsLoading(false);
                return;
            }

            // Success logic
            // In a production app: The JWT token (data.token) would be stored in cookies/localStorage here.
            // The token is critical for authenticating subsequent API requests.
            if (data.token) {
                localStorage.setItem('momentum_token', data.token);
                // Dispatch custom event to notify SessionProvider
                window.dispatchEvent(new Event('momentum_login'));
            }

            setSuccess(true);

            setTimeout(() => {
                // Redirect to the protected dashboard area after login
                router.push('/family');
            }, 1500);

        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('A network error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (credential: string) => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/web-bff/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: credential }),
            });

            const data = await response.json();

            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                const message = data.message || 'Google login failed.';
                setError(message);
                setIsLoading(false);
                return;
            }

            // Store token
            if (data.token) {
                localStorage.setItem('momentum_token', data.token);
                window.dispatchEvent(new Event('momentum_login'));
            }

            // Check if user needs onboarding
            if (data.data?.needsOnboarding) {
                // Redirect to onboarding page
                router.push('/onboarding');
            } else {
                // User already completed onboarding, go to family page
                setSuccess(true);
                setTimeout(() => {
                    router.push('/family');
                }, 1500);
            }

        } catch (err) {
            console.error('Google login error:', err);
            setError('A network error occurred during Google login.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg">
            <h2 className="text-3xl font-semibold text-text-primary text-center mb-6">
                Welcome Back
            </h2>

            {/* Status Indicators */}
            {error && (
                <div className="mb-4 flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center p-4 bg-signal-success/10 text-signal-success rounded-lg border border-signal-success/30">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">Login Successful! Redirecting...</p>
                </div>
            )}

            {/* Google OAuth Button */}
            <GoogleOAuthButton text="signin" />

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-bg-surface text-text-secondary">Or login with email</span>
                </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    Icon={Mail}
                    placeholder="your.parent.email@example.com"
                    value={formData.email} // [FIX] Pass state value
                    onChange={handleInputChange} // [FIX] Pass handler
                />

                <FormInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    Icon={Lock}
                    placeholder="Your secret password"
                    value={formData.password} // [FIX] Pass state value
                    onChange={handleInputChange} // [FIX] Pass handler
                />

                {/* Primary Button: Login */}
                <div>
                    <button
                        type="submit"
                        disabled={isLoading || success}
                        // Uses Mandated Primary Button Styling (Source: Style Guide, 5. Component Design)
                        className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-all duration-200 
                        ${isLoading || success ? 'bg-action-primary/60 cursor-not-allowed' : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'}`}
                    >
                        {isLoading && <Loader className="w-5 h-5 mr-2 animate-spin" />}
                        {!isLoading && <LogIn className="w-5 h-5 mr-2" />}
                        {success ? 'Logging In...' : 'Login'}
                    </button>.
                </div>
            </form>

            {/* Auxiliary Link */}
            <p className="mt-6 text-center text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-action-primary hover:text-action-hover">
                    Sign Up here
                </Link>
            </p>
        </div>
    );
};

export default LoginForm;
