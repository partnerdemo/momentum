'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, AlertTriangle, Loader, CheckCircle, Home, CheckIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormInput from '../layout/FormInput';
import GoogleOAuthButton from './GoogleOAuthButton';
import { PROFILE_COLORS } from '../../lib/constants';

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    householdName: string;
    userDisplayName: string;
    inviteCode?: string;
}

const SignUpForm: React.FC = () => {
    const [formData, setFormData] = useState<FormState>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        // Removed unused fields from state initializers to keep it clean, 
        // though interface might technically still have them if I don't update it (which I should).
        // For safe replacing, I will stick to what is needed.
        householdName: '', // Kept empty
        userDisplayName: '', // Kept empty
        inviteCode: '', // Kept empty
    });
    // Removed hasInviteCode and selectedColor state as they are no longer UI driven

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

        // Validation - Minimal
        if (
            !formData.firstName || !formData.lastName || !formData.email || !formData.password
        ) {
            setError('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            // Simplified Payload
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                // Backend will handle defaults for display name and household
            };

            const response = await fetch('/web-bff/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                const message = data.message || 'An unknown error occurred during sign-up.';
                setError(message);
                setIsLoading(false);
                return;
            }

            setSuccess(true);

            if (data.token) {
                localStorage.setItem('momentum_token', data.token);
            }

            // Redirect to Onboarding
            setTimeout(() => {
                router.push('/onboarding');
            }, 1000);

        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('A network error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg">
            <h2 className="text-3xl font-semibold text-text-primary text-center mb-6">
                Create Your Account
            </h2>

            {error && (
                <div className="mb-4 flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center p-4 bg-signal-success/10 text-signal-success rounded-lg border border-signal-success/30">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">Success! Redirecting you to setup...</p>
                </div>
            )}

            {/* Google OAuth Button */}
            <GoogleOAuthButton text="signup" />

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-bg-surface text-text-secondary">Or sign up with email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        id="firstName"
                        name="firstName"
                        type="text"
                        label="First Name"
                        Icon={User}
                        placeholder="e.g., Jessica"
                        value={formData.firstName}
                        onChange={handleInputChange}
                    />

                    <FormInput
                        id="lastName"
                        name="lastName"
                        type="text"
                        label="Last Name"
                        Icon={User}
                        placeholder="e.g., Smith"
                        value={formData.lastName}
                        onChange={handleInputChange}
                    />
                </div>

                <FormInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    Icon={Mail}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                />

                <FormInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    Icon={Lock}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                />

                <div>
                    <button
                        type="submit"
                        disabled={isLoading || success}
                        className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-all duration-200 
                        ${isLoading || success ? 'bg-action-primary/60 cursor-not-allowed' : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'}`}
                    >
                        {isLoading && <Loader className="w-5 h-5 mr-2" />}
                        {success ? 'Signing Up...' : 'Create Account'}
                    </button>
                    <p className="mt-4 text-center text-xs text-text-secondary">
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-action-primary hover:text-action-hover">
                    Login here
                </Link>
            </p>
        </div>
    );
};

export default SignUpForm;